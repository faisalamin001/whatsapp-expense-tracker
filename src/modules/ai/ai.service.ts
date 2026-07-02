import OpenAI from 'openai';
import { z } from 'zod';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { SYSTEM_PROMPT, buildUserPrompt } from './ai.prompts';
import { AIParseOutcome, ParsedTransaction } from './ai.types';

const parsedTransactionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(1).max(5).toUpperCase(),
  category: z.enum([
    'Food', 'Transport', 'Shopping', 'Bills', 'Health',
    'Entertainment', 'Education', 'Salary', 'Groceries',
    'Utilities', 'Rent', 'Other',
  ]),
  description: z.string().min(1).max(200),
  type: z.enum(['expense', 'income']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  confidence: z.number().min(0).max(1),
});

const errorResponseSchema = z.object({
  error: z.literal('NOT_A_TRANSACTION'),
  reason: z.string(),
});

export class AIService {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async parseTransaction(message: string): Promise<AIParseOutcome> {
    const currentDate = new Date().toISOString().split('T')[0] as string;

    logger.debug('Sending message to OpenAI', { message, currentDate });

    let rawContent: string;

    try {
      const response = await this.client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(message, currentDate) },
        ],
        temperature: 0,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      });

      rawContent = response.choices[0]?.message?.content ?? '';

      logger.debug('OpenAI raw response', { rawContent });
    } catch (err) {
      const error = err as Error;
      logger.error('OpenAI API call failed', { error: error.message });
      return { success: false, reason: `OpenAI request failed: ${error.message}` };
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawContent);
    } catch {
      logger.error('OpenAI response was not valid JSON', { rawContent });
      return { success: false, reason: 'OpenAI returned invalid JSON' };
    }

    const errorCheck = errorResponseSchema.safeParse(parsed);
    if (errorCheck.success) {
      return { success: false, reason: errorCheck.data.reason };
    }

    const result = parsedTransactionSchema.safeParse(parsed);

    if (!result.success) {
      logger.error('OpenAI response failed schema validation', {
        errors: result.error.flatten(),
        rawContent,
      });
      return { success: false, reason: 'OpenAI response did not match expected format' };
    }

    const data: ParsedTransaction = result.data;

    logger.info('OpenAI parsed transaction', {
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      type: data.type,
      confidence: data.confidence,
    });

    return { success: true, data };
  }
}
