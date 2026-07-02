/**
 * Manual test runner for AI parsing service.
 * Run with: npx ts-node --transpile-only src/modules/ai/ai.test-runner.ts
 */
import { AIService } from './ai.service';

const aiService = new AIService();

const TEST_MESSAGES = [
  'Spent 500 on lunch',
  'Paid 2500 for groceries',
  'Bought shoes for 7000',
  'Received salary 180000',
  'Paid electricity bill 4200',
  'Spent $25 on coffee',
  'spent 550 on burgers yesterday',
  'hello how are you',           // should fail — not a transaction
  'abc xyz 123',                 // should fail — gibberish
];

async function run(): Promise<void> {
  console.log('='.repeat(60));
  console.log('AI Parsing Service — Test Runner');
  console.log('='.repeat(60));

  for (const msg of TEST_MESSAGES) {
    console.log(`\nINPUT:  "${msg}"`);
    const result = await aiService.parseTransaction(msg);

    if (result.success) {
      const d = result.data;
      console.log(`OUTPUT: ✅ ${d.type.toUpperCase()} | ${d.currency} ${d.amount} | ${d.category} | "${d.description}" | ${d.date} | confidence: ${d.confidence}`);
    } else {
      console.log(`OUTPUT: ❌ NOT PARSED — ${result.reason}`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

run().catch(console.error);
