import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Conexão do Redis compartilhada
export const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

// Fila para envio de mensagens privadas no WhatsApp
export const whatsappQueue = new Queue('whatsapp-queue', {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,             // Tenta até 3 vezes se falhar
    backoff: {
      type: 'exponential',
      delay: 5000,          // Espera 5s antes de tentar novamente, aumentando exponencialmente
    },
    removeOnComplete: true, // Limpa o job quando finalizado
    removeOnFail: false,
  },
});

// Canal de eventos da fila
export const whatsappQueueEvents = new QueueEvents('whatsapp-queue', { connection: connection as any });

/**
 * Enfileira uma mensagem com atraso para simular escrita humana e evitar ban
 */
export async function queuePrivateMessage(toJid: string, text: string, delayMs = 3000) {
  await whatsappQueue.add(
    'send-dm',
    { toJid, text },
    { delay: delayMs } // Atraso configurável
  );
}
