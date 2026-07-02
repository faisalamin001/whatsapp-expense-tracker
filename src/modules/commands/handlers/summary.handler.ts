import { TransactionService } from '../../transactions/transaction.service';
import { TransactionSummary } from '../../transactions/transaction.types';
import { CommandContext } from '../command.types';

function formatSummaryMessage(
  summary: TransactionSummary,
  label: string
): string {
  const { totalExpenses, totalIncome, balance, currency, transactionCount } = summary;

  if (transactionCount === 0) {
    return `📭 No transactions found for ${label}.`;
  }

  const balanceSign = balance >= 0 ? '+' : '';
  const balanceEmoji = balance >= 0 ? '🟢' : '🔴';

  return `*📊 ${label} Summary*

💸 Expenses:  ${currency} ${totalExpenses.toLocaleString()}
💵 Income:    ${currency} ${totalIncome.toLocaleString()}
${balanceEmoji} Balance:   ${balanceSign}${currency} ${Math.abs(balance).toLocaleString()}

📝 Transactions: ${transactionCount}`;
}

export async function todayHandler(
  context: CommandContext,
  transactionService: TransactionService
): Promise<string> {
  const { from, to } = transactionService.getTodayRange();
  const summary = await transactionService.getSummaryForPeriod(context.userId, from, to);
  return formatSummaryMessage(summary, 'Today');
}

export async function thisWeekHandler(
  context: CommandContext,
  transactionService: TransactionService
): Promise<string> {
  const { from, to } = transactionService.getWeekRange();
  const summary = await transactionService.getSummaryForPeriod(context.userId, from, to);
  return formatSummaryMessage(summary, 'This Week');
}

export async function thisMonthHandler(
  context: CommandContext,
  transactionService: TransactionService
): Promise<string> {
  const { from, to } = transactionService.getMonthRange();
  const summary = await transactionService.getSummaryForPeriod(context.userId, from, to);
  return formatSummaryMessage(summary, 'This Month');
}

export async function balanceHandler(
  context: CommandContext,
  transactionService: TransactionService
): Promise<string> {
  const { from, to } = transactionService.getMonthRange();
  const summary = await transactionService.getSummaryForPeriod(context.userId, from, to);

  if (summary.transactionCount === 0) {
    return '📭 No transactions this month yet.';
  }

  const balanceSign = summary.balance >= 0 ? '+' : '-';
  const balanceEmoji = summary.balance >= 0 ? '🟢' : '🔴';
  const monthName = new Date().toLocaleString('default', { month: 'long' });

  return `*${balanceEmoji} Balance — ${monthName}*

💵 Income:   ${summary.currency} ${summary.totalIncome.toLocaleString()}
💸 Expenses: ${summary.currency} ${summary.totalExpenses.toLocaleString()}
━━━━━━━━━━━━━━━
💰 Net:      ${balanceSign}${summary.currency} ${Math.abs(summary.balance).toLocaleString()}`;
}
