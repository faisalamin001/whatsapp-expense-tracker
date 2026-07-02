import { TransactionResult } from '../transactions/transaction.types';

export function formatTransactionConfirmation(tx: TransactionResult): string {
  const emoji = tx.type === 'expense' ? '💸' : '💵';
  const typeLabel = tx.type === 'expense' ? 'Expense' : 'Income';
  const category = tx.categoryName ? `\n📂 Category: ${tx.categoryName}` : '';
  const date = new Date(tx.transactionDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `${emoji} *${typeLabel} Logged*

💰 Amount: ${tx.currency} ${Number(tx.amount).toLocaleString()}
📝 ${tx.description}${category}
📅 Date: ${date}

_Send "today" or "balance" to see your summary._`;
}

export function formatUnknownMessage(): string {
  return `❓ I couldn't understand that.

Try sending a transaction like:
• _Spent 500 on lunch_
• _Paid 2500 for groceries_
• _Received salary 180000_

Or type *help* to see all commands.`;
}

export function formatErrorMessage(): string {
  return `⚠️ Something went wrong on my end. Please try again in a moment.`;
}
