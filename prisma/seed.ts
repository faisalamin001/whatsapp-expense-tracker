import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔', isDefault: true },
  { name: 'Transport', icon: '🚗', isDefault: true },
  { name: 'Shopping', icon: '🛍️', isDefault: true },
  { name: 'Bills', icon: '📄', isDefault: true },
  { name: 'Health', icon: '💊', isDefault: true },
  { name: 'Entertainment', icon: '🎬', isDefault: true },
  { name: 'Education', icon: '📚', isDefault: true },
  { name: 'Salary', icon: '💵', isDefault: true },
  { name: 'Groceries', icon: '🛒', isDefault: true },
  { name: 'Utilities', icon: '💡', isDefault: true },
  { name: 'Rent', icon: '🏠', isDefault: true },
  { name: 'Other', icon: '💰', isDefault: true },
];

async function main() {
  console.log('Seeding categories...');

  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { icon: category.icon },
      create: category,
    });
  }

  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
