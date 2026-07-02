import { TransactionService } from '../transactions/transaction.service';
import { CommandContext, CommandMatch } from './command.types';
import { helpHandler } from './handlers/help.handler';
import {
  todayHandler,
  thisWeekHandler,
  thisMonthHandler,
  balanceHandler,
} from './handlers/summary.handler';
import { historyHandler, categoriesHandler } from './handlers/history.handler';
import { deleteLastHandler } from './handlers/delete.handler';

// Order matters — more specific patterns first
const COMMAND_PATTERNS: Array<{ pattern: RegExp; name: CommandMatch['name'] }> = [
  { pattern: /^help$/i,                                    name: 'help' },
  { pattern: /^today$/i,                                   name: 'today' },
  { pattern: /^this\s+week$/i,                             name: 'this_week' },
  { pattern: /^(this\s+month|summary)$/i,                  name: 'this_month' },
  { pattern: /^balance$/i,                                  name: 'balance' },
  { pattern: /^categories$/i,                              name: 'categories' },
  { pattern: /^(last\s+\d+|last\s+\d+\s+transactions?|history)$/i, name: 'last_transactions' },
  { pattern: /^delete\s+last(\s+transaction)?$/i,          name: 'delete_last' },
];

export function detectCommand(message: string): CommandMatch | null {
  const normalized = message.trim();

  for (const { pattern, name } of COMMAND_PATTERNS) {
    if (pattern.test(normalized)) {
      return { name };
    }
  }

  return null;
}

export async function handleCommand(
  command: CommandMatch,
  context: CommandContext,
  transactionService: TransactionService
): Promise<string> {
  switch (command.name) {
    case 'help':
      return helpHandler();

    case 'today':
      return todayHandler(context, transactionService);

    case 'this_week':
      return thisWeekHandler(context, transactionService);

    case 'this_month':
    case 'summary':
      return thisMonthHandler(context, transactionService);

    case 'balance':
      return balanceHandler(context, transactionService);

    case 'categories':
      return categoriesHandler(context, transactionService);

    case 'last_transactions':
      return historyHandler(context, transactionService);

    case 'delete_last':
      return deleteLastHandler(context, transactionService);
  }
}
