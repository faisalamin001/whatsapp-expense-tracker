import { TransactionService } from '../../transactions/transaction.service';
import { CommandContext } from '../command.types';

export async function deleteLastHandler(
  context: CommandContext,
  transactionService: TransactionService
): Promise<string> {
  const deleted = await transactionService.deleteLatest(context.userId);

  if (!deleted) {
    return '📭 No transactions to delete.';
  }

  const date = new Date(deleted.transactionDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });

  return `🗑️ Deleted: *${deleted.currency} ${Number(deleted.amount).toLocaleString()}* — ${deleted.description} (${date})`;
}
