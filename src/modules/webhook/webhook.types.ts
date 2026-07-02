export interface WhatsAppTextMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text';
  text: { body: string };
}

export interface WhatsAppStatusUpdate {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}

export interface WhatsAppValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  messages?: WhatsAppTextMessage[];
  statuses?: WhatsAppStatusUpdate[];
}

export interface WhatsAppChange {
  value: WhatsAppValue;
  field: string;
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppEntry[];
}

export interface IncomingMessage {
  messageId: string;
  phone: string;
  body: string;
  timestamp: Date;
}
