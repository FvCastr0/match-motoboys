import { Worker } from 'bullmq';
import { connection } from './queue';

interface SendMessageJob {
  toJid: string;
  text: string;
}

/**
 * Inicializa o Worker do BullMQ para processar o envio de mensagens do WhatsApp
 * de forma sequencial com concorrência limitada (evitando spam)
 */
export function setupWhatsAppWorker(sendDmHandler: (jid: string, text: string) => Promise<void>) {
  const worker = new Worker<SendMessageJob>(
    'whatsapp-queue',
    async (job) => {
      const { toJid, text } = job.data;
      console.log(`🤖 [Worker] Enviando mensagem enfileirada para ${toJid}...`);
      await sendDmHandler(toJid, text);
    },
    {
      connection: connection as any,
      concurrency: 1, // Processa uma mensagem de cada vez para simular digitação e rate limit
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ [Worker] Mensagem enviada com sucesso: Job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [Worker] Falha ao enviar mensagem para ${job?.data.toJid}:`, err.message);
  });

  return worker;
}
