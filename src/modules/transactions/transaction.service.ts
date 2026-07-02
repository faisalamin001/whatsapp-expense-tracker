import { logger } from '../../config/logger';
import { ParsedTransaction } from '../ai/ai.types';
import { TransactionRepository } from './transaction.repository';
import {
  TransactionResult,
  TransactionSummary,
  CategoryBreakdown,
} from './transaction.types';

export class TransactionService {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async saveFromAI(
    userId: string,
    messageId: string,
    rawMessage: string,
    parsed: ParsedTransaction
  ): Promise<TransactionResult> {
    const transactionDate = new Date(parsed.date);

    const result = await this.transactionRepository.create({
      userId,
      messageId,
      rawMessage,
      amount: parsed.amount,
      currency: parsed.currency,
      type: parsed.type,
      description: parsed.description,
      categoryName: parsed.category,
      transactionDate,
      aiConfidence: parsed.confidence,
    });

    logger.info('Transaction saved', {
      transactionId: result.id,
      userId,
      amount: result.amount,
      currency: result.currency,
      type: result.type,
    });

    return result;
  }

  async getRecent(userId: string, limit = 10): Promise<TransactionResult[]> {
    return this.transactionRepository.findRecent(userId, limit);
  }

  async getSummaryForPeriod(
    userId: string,
    from: Date,
    to: Date
  ): Promise<TransactionSummary> {
    return this.transactionRepository.getSummary(userId, from, to);
  }

  async getCategoryBreakdown(
    userId: string,
    from: Date,
    to: Date
  ): Promise<CategoryBreakdown[]> {
    return this.transactionRepository.getCategoryBreakdown(userId, from, to);
  }

  async deleteLatest(userId: string): Promise<TransactionResult | null> {
    const deleted = await this.transactionRepository.deleteLatest(userId);

    if (deleted) {
      logger.info('Transaction deleted', { transactionId: deleted.id, userId });
    }

    return deleted;
  }

  getTodayRange(): { from: Date; to: Date } {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  getWeekRange(): { from: Date; to: Date } {
    const from = new Date();
    from.setDate(from.getDate() - from.getDay());
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  getMonthRange(): { from: Date; to: Date } {
    const from = new Date();
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }
}
