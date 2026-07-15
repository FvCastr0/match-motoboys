import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
export declare const connection: IORedis;
export declare const whatsappQueue: Queue<any, any, string, any, any, string>;
export declare const whatsappQueueEvents: QueueEvents;
/**
 * Enfileira uma mensagem com atraso para simular escrita humana e evitar ban
 */
export declare function queuePrivateMessage(toJid: string, text: string, delayMs?: number): Promise<void>;
//# sourceMappingURL=queue.d.ts.map