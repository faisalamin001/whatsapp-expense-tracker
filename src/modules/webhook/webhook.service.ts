import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { WhatsAppWebhookPayload, IncomingMessage } from './webhook.types';

export class WebhookService {
  extractMessage(payload: WhatsAppWebhookPayload): IncomingMessage | null {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== 'text') {
      return null;
    }

    return {
      messageId: message.id,
      phone: message.from,
      body: message.text.body.trim(),
      timestamp: new Date(Number(message.timestamp) * 1000),
    };
  }

  /**
   * Atomically claim a message for processing.
   * Uses INSERT (not upsert) so the DB unique constraint on message_id
   * is the dedup gate — concurrent duplicates fail at the DB level, not the app level.
   *
   * Returns true if this process claimed the message (should proceed).
   * Returns false if another process already claimed it (skip).
   */
  async claimMessage(
    messageId: string,
    phone: string,
    payload: WhatsAppWebhookPayload
  ): Promise<boolean> {
    try {
      await prisma.webhookLog.create({
        data: {
          messageId,
          phone,
          payload: payload as object,
          processed: false,
        },
      });

      logger.debug('Webhook claimed', { messageId });
      return true;
    } catch (err) {
      // P2002 = Unique constraint violation — already claimed by another request
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        logger.info('Duplicate webhook rejected at DB level', { messageId });
        return false;
      }
      throw err;
    }
  }

  async markProcessed(messageId: string): Promise<void> {
    await prisma.webhookLog.update({
      where: { messageId },
      data: { processed: true, error: null },
    });
  }

  async markFailed(messageId: string, error: string): Promise<void> {
    await prisma.webhookLog
      .update({
        where: { messageId },
        data: { processed: false, error },
      })
      .catch((updateErr: Error) => {
        logger.error('Failed to mark webhook as failed', {
          messageId,
          updateError: updateErr.message,
        });
      });
  }

  async getFailedWebhooks(limit = 50) {
    return prisma.webhookLog.findMany({
      where: { processed: false, error: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
