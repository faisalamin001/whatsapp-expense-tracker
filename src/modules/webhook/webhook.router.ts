import { Router } from 'express';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { UserService } from '../users/user.service';
import { UserRepository } from '../users/user.repository';
import { AIService } from '../ai/ai.service';
import { TransactionService } from '../transactions/transaction.service';
import { TransactionRepository } from '../transactions/transaction.repository';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { verifyWebhookSignature } from '../../middleware/webhook-verify.middleware';

const router = Router();

const webhookService = new WebhookService();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const aiService = new AIService();
const transactionRepository = new TransactionRepository();
const transactionService = new TransactionService(transactionRepository);
const whatsAppService = new WhatsAppService();

const webhookController = new WebhookController(
  webhookService,
  userService,
  aiService,
  transactionService,
  whatsAppService
);

router.get('/', (req, res) => webhookController.verify(req, res));

router.post(
  '/',
  verifyWebhookSignature,
  (req, res, next) => webhookController.receive(req, res, next)
);

export { router as webhookRouter };
