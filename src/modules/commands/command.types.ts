export type CommandName =
  | 'help'
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'summary'
  | 'balance'
  | 'categories'
  | 'last_transactions'
  | 'delete_last';

export interface CommandContext {
  userId: string;
  phone: string;
  currency: string;
}

export interface CommandMatch {
  name: CommandName;
}
