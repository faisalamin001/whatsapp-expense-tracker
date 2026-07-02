/**
 * Replay failed webhooks.
 * Finds all webhook_logs where processed=false and error IS NOT NULL,
 * resets them to pending, and resubmits to the local webhook endpoint.
 *
 * Usage: npx ts-node --transpile-only src/scripts/replay-failed.ts
 */
import crypto from 'crypto';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PORT = process.env['PORT'] ?? '3000';
const APP_SECRET = process.env['WHATSAPP_APP_SECRET'] ?? '';
const WEBHOOK_URL = `http://localhost:${PORT}/webhook`;

function sign(body: string): string {
  return `sha256=${crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex')}`;
}

async function main(): Promise<void> {
  const failed = await prisma.webhookLog.findMany({
    where: { processed: false, error: { not: null } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  if (failed.length === 0) {
    console.log('No failed webhooks to replay.');
    return;
  }

  console.log(`Found ${failed.length} failed webhook(s) to replay.\n`);

  for (const log of failed) {
    const body = JSON.stringify(log.payload);
    const signature = sign(body);

    console.log(`Replaying: ${log.messageId} (phone: ${log.phone})`);

    // Reset error so the claim won't be blocked by the unique constraint
    await prisma.webhookLog.delete({ where: { messageId: log.messageId } });

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': signature,
        },
        body,
      });

      console.log(`  → ${res.status} ${res.ok ? '✅' : '❌'}`);
    } catch (err) {
      console.error(`  → Request failed: ${(err as Error).message}`);
    }

    // Small delay between replays to avoid overwhelming the server
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('\nReplay complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
