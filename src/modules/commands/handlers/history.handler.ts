import { TransactionService } from '../../transactions/transaction.service';
import { CommandContext } from '../command.types';

export async function historyHandler(
  context: CommandContext,
  transactionService: TransactionService
): Promise<string> {
  const transactions = await transactionService.getRecent(context.userId, 10);

  if (transactions.length === 0) {
    return '📭 No transactions found. Start by sending a message like:\n_Spent 500 on lunch_';
  }

  const lines = transactions.map((tx, i) => {
    const date = new Date(tx.transactionDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
    const emoji = tx.type === 'expense' ? '💸' : '💵';
    const category = tx.categoryName ? ` (${tx.categoryName})` : '';
    return `${i + 1}. ${emoji} ${tx.currency} ${Number(tx.amount).toLocaleString()} — ${tx.description}${category} • ${date}`;
  });

  return `*🧾 Last ${transactions.length} Transactions*\n\n${lines.join('\n')}`;
}

export async function categoriesHandler(
  context: CommandContext,
  transactionService: TransactionService
): Promise<string> {
  const { from, to } = transactionService.getMonthRange();
  const breakdown = await transactionService.getCategoryBreakdown(context.userId, from, to);

  if (breakdown.length === 0) {
    return '📭 No expense transactions this month.';
  }

  const total = breakdown.reduce((sum, b) => sum + b.total, 0);
  const monthName = new Date().toLocaleString('default', { month: 'long' });

  const lines = breakdown.map((b) => {
    const pct = total > 0 ? ((b.total / total) * 100).toFixed(0) : '0';
    return `• *${b.category}*: PKR ${b.total.toLocaleString()} (${pct}%) — ${b.count} txn${b.count > 1 ? 's' : ''}`;
  });

  return `*📂 Spending by Category — ${monthName}*\n\n${lines.join('\n')}\n\n*Total: PKR ${total.toLocaleString()}*`;
}
