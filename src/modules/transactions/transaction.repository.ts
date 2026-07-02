import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../config/database';
import {
  CreateTransactionInput,
  TransactionResult,
  TransactionSummary,
  CategoryBreakdown,
} from './transaction.types';

export class TransactionRepository {
  async create(input: CreateTransactionInput): Promise<TransactionResult> {
    const category = await prisma.category.findFirst({
      where: { name: input.categoryName },
    });

    const tx = await prisma.transaction.create({
      data: {
        userId: input.userId,
        messageId: input.messageId,
        rawMessage: input.rawMessage,
        amount: new Prisma.Decimal(input.amount),
        currency: input.currency,
        type: input.type,
        description: input.description,
        categoryId: category?.id ?? null,
        transactionDate: input.transactionDate,
        aiConfidence: input.aiConfidence,
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        type: true,
        description: true,
        transactionDate: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    });

    return {
      id: tx.id,
      amount: tx.amount.toString(),
      currency: tx.currency,
      type: tx.type,
      description: tx.description,
      categoryName: tx.category?.name ?? null,
      transactionDate: tx.transactionDate,
      createdAt: tx.createdAt,
    };
  }

  async findRecent(userId: string, limit: number): Promise<TransactionResult[]> {
    const rows = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: 'desc' },
      take: limit,
      select: {
        id: true,
        amount: true,
        currency: true,
        type: true,
        description: true,
        transactionDate: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    });

    return rows.map((tx) => ({
      id: tx.id,
      amount: tx.amount.toString(),
      currency: tx.currency,
      type: tx.type,
      description: tx.description,
      categoryName: tx.category?.name ?? null,
      transactionDate: tx.transactionDate,
      createdAt: tx.createdAt,
    }));
  }

  async getSummary(userId: string, from: Date, to: Date): Promise<TransactionSummary> {
    const result = await prisma.transaction.groupBy({
      by: ['type', 'currency'],
      where: {
        userId,
        transactionDate: { gte: from, lte: to },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    let totalExpenses = 0;
    let totalIncome = 0;
    let transactionCount = 0;
    let currency = 'PKR';

    for (const row of result) {
      const amount = Number(row._sum.amount ?? 0);
      transactionCount += row._count.id;
      currency = row.currency;

      if (row.type === 'expense') totalExpenses += amount;
      else totalIncome += amount;
    }

    return {
      totalExpenses,
      totalIncome,
      balance: totalIncome - totalExpenses,
      currency,
      transactionCount,
    };
  }

  async getCategoryBreakdown(
    userId: string,
    from: Date,
    to: Date
  ): Promise<CategoryBreakdown[]> {
    const rows = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'expense',
        transactionDate: { gte: from, lte: to },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const categoryIds = rows.map((r) => r.categoryId).filter(Boolean) as string[];

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return rows
      .map((row) => ({
        category: categoryMap.get(row.categoryId ?? '') ?? 'Other',
        total: Number(row._sum.amount ?? 0),
        count: row._count.id,
      }))
      .sort((a, b) => b.total - a.total);
  }

  async deleteLatest(userId: string): Promise<TransactionResult | null> {
    const latest = await prisma.transaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        currency: true,
        type: true,
        description: true,
        transactionDate: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    });

    if (!latest) return null;

    await prisma.transaction.delete({ where: { id: latest.id } });

    return {
      id: latest.id,
      amount: latest.amount.toString(),
      currency: latest.currency,
      type: latest.type,
      description: latest.description,
      categoryName: latest.category?.name ?? null,
      transactionDate: latest.transactionDate,
      createdAt: latest.createdAt,
    };
  }

  async countForUser(userId: string): Promise<number> {
    return prisma.transaction.count({ where: { userId } });
  }
}
