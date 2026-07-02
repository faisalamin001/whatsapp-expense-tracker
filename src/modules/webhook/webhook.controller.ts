import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { WebhookService } from './webhook.service';
import { WhatsAppWebhookPayload } from './webhook.types';
import { UserService } from '../users/user.service';
import { AIService } from '../ai/ai.service';
import { TransactionService } from '../transactions/transaction.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import {
  formatTransactionConfirmation,
  formatUnknownMessage,
  formatErrorMessage,
} from '../whatsapp/whatsapp.formatter';
import { detectCommand, handleCommand } from '../commands/command.router';

export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly userService: UserService,
    private readonly aiService: AIService,
    private readonly transactionService: TransactionService,
    private readonly whatsAppService: WhatsAppService
  ) {}

  // GET /webhook — Meta verification handshake
  verify(req: Request, res: Response): void {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      logger.info('WhatsApp webhook verified successfully');
      res.status(200).send(challenge);
      return;
    }

    logger.warn('Webhook verification failed', { mode, token });
    res.status(403).json({ error: 'Verification failed' });
  }

  // POST /webhook — Incoming messages
  async receive(req: Request, res: Response, _next: NextFunction): Promise<void> {
    // Always acknowledge immediately — Meta retries if no response within 20s
    res.status(200).json({ status: 'ok' });

    const payload = req.body as WhatsAppWebhookPayload;

    if (payload.object !== 'whatsapp_business_account') {
      return;
    }

    const message = this.webhookService.extractMessage(payload);

    if (!message) {
      // Status updates (delivered/read) — ignore silently
      return;
    }

    logger.info('Incoming message', {
      messageId: message.messageId,
      phone: message.phone,
      body: message.body,
    });

    // Atomic claim — DB unique constraint prevents concurrent duplicates
    const claimed = await this.webhookService
      .claimMessage(message.messageId, message.phone, payload)
      .catch((err: Error) => {
        logger.error('Failed to claim webhook', {
          messageId: message.messageId,
          error: err.message,
        });
        return false;
      });

    if (!claimed) {
      return;
    }

    try {
      const user = await this.userService.getOrCreate(message.phone);

      const command = detectCommand(message.body);

      if (command) {
        logger.info('Command detected', { command: command.name, userId: user.id });

        const reply = await handleCommand(
          command,
          { userId: user.id, phone: user.phone, currency: user.currency },
          this.transactionService
        );

        await this.whatsAppService.sendMessage(message.phone, reply);
        await this.webhookService.markProcessed(message.messageId);
        return;
      }

      const aiResult = await this.aiService.parseTransaction(message.body);

      if (!aiResult.success) {
        logger.info('AI could not parse message', {
          messageId: message.messageId,
          reason: aiResult.reason,
        });

        await this.whatsAppService.sendMessage(message.phone, formatUnknownMessage());
        // Mark processed — we handled it, just couldn't parse the transaction
        await this.webhookService.markProcessed(message.messageId);
        return;
      }

      const transaction = await this.transactionService.saveFromAI(
        user.id,
        message.messageId,
        message.body,
        aiResult.data
      );

      await this.whatsAppService.sendMessage(
        message.phone,
        formatTransactionConfirmation(transaction)
      );

      await this.webhookService.markProcessed(message.messageId);
    } catch (err) {
      const error = err as Error;

      logger.error('Failed to process webhook', {
        messageId: message.messageId,
        error: error.message,
        stack: error.stack,
      });

      await this.webhookService.markFailed(
        message.messageId,
        `${error.message}\n${error.stack ?? ''}`
      );

      // Best-effort reply — failure here never obscures the original error
      await this.whatsAppService
        .sendMessage(message.phone, formatErrorMessage())
        .catch((sendErr: Error) =>
          logger.error('Failed to send error reply', { error: sendErr.message })
        );
    }
  }
}
