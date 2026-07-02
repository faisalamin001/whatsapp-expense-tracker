export function helpHandler(): string {
  return `*💰 Expense Tracker — Commands*

*Add transactions by just sending a message:*
• Spent 500 on lunch
• Paid 2500 for groceries
• Received salary 180000

*Commands:*
• *today* — today's spending
• *this week* — this week's summary
• *this month* — this month's summary
• *summary* — same as this month
• *balance* — income vs expenses this month
• *categories* — spending by category this month
• *last 10* — your last 10 transactions
• *delete last* — delete your last transaction
• *help* — show this message`;
}
