import { logger } from '../../config/logger';
import { UserRepository } from './user.repository';
import { UserResult } from './user.types';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getOrCreate(phone: string): Promise<UserResult> {
    const user = await this.userRepository.upsertByPhone({ phone });

    logger.debug('User resolved', { userId: user.id, phone: user.phone });

    return user;
  }
}
