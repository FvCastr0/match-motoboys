import { Worker } from 'bullmq';
interface SendMessageJob {
    toJid: string;
    text: string;
}
/**
 * Inicializa o Worker do BullMQ para processar o envio de mensagens do WhatsApp
 * de forma sequencial com concorrência limitada (evitando spam)
 */
export declare function setupWhatsAppWorker(sendDmHandler: (jid: string, text: string) => Promise<void>): Worker<SendMessageJob, any, string>;
export {};
//# sourceMappingURL=worker.d.ts.map