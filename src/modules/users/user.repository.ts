import { prisma } from '../../config/database';
import { UpsertUserInput, UserResult } from './user.types';

export class UserRepository {
  async upsertByPhone(input: UpsertUserInput): Promise<UserResult> {
    return prisma.user.upsert({
      where: { phone: input.phone },
      update: {},
      create: {
        phone: input.phone,
        name: input.name ?? null,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        currency: true,
        createdAt: true,
      },
    });
  }

  async findByPhone(phone: string): Promise<UserResult | null> {
    return prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        name: true,
        currency: true,
        createdAt: true,
      },
    });
  }
}
