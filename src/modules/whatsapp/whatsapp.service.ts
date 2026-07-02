import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { SendMessagePayload, SendMessageResponse } from './whatsapp.types';

const GRAPH_API_URL = `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

export class WhatsAppService {
  async sendMessage(to: string, body: string): Promise<void> {
    const payload: SendMessagePayload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    };

    logger.debug('Sending WhatsApp message', { to, bodyLength: body.length });

    const response = await fetch(GRAPH_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('WhatsApp API error', {
        status: response.status,
        to,
        error: errorText,
      });
      throw new Error(`WhatsApp API responded with ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as SendMessageResponse;

    logger.info('WhatsApp message sent', {
      to,
      messageId: data.messages[0]?.id,
    });
  }
}
