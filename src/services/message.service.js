// src/services/message.service.js
import twilioClient from '../config/twilio.config.js';
import { createMessage, findOrCreateThread } from '../models/message.model.js';
import { v4 as uuidv4 } from 'uuid';

const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

export const sendMessage = async ({ to, body, companyId }) => {
  // 1. Send message via Twilio
  const message = await twilioClient.messages.create({
    body,
    from: `whatsapp:${twilioWhatsAppNumber}`,
    to: `whatsapp:${to}`,
  });

  // 2. Ensure chat thread exists
  const threadId = await findOrCreateThread({ userId: to, companyId, channel: 'whatsapp' });

  // 3. Store message in DB
  await createMessage({
    thread_id: threadId,
    role: 'assistant',
    content: body,
  });

  return message;
};

export const storeIncomingMessage = async (from, body) => {
  const cleanFrom = from.replace(/^whatsapp:/, '');

  // TODO: Map phone number to companyId (could be dynamic per user or static if only you test)
  const companyId = process.env.TEST_COMPANY_ID || 'demo-company-id';

  const threadId = await findOrCreateThread({
    userId: cleanFrom,
    companyId,
    channel: 'whatsapp'
  });

  await createMessage({
    thread_id: threadId,
    role: 'user',
    content: body,
  });

  // Optionally trigger chatbot response here
  // const { botResponse } = await getChatResponse(cleanFrom, body);
  // await sendMessage({ to: cleanFrom, body: botResponse, companyId });
};
