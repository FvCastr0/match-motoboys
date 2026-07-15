import cron from 'node-cron';
import { WhatsAppService } from './WhatsAppService';

export class CronService {
  private wpService: WhatsAppService;

  constructor(wpService: WhatsAppService) {
    this.wpService = wpService;
  }

  /**
   * Inicializa as cronjobs de abertura e fechamento de escala
   */
  init() {
    const openCronExpression = process.env.SCALE_OPEN_CRON || '0 12 * * *';
    const closeCronExpression = process.env.SCALE_CLOSE_CRON || '0 0 * * *';

    console.log(`⏰ Cron Job de Abertura de Vagas configurado para: "${openCronExpression}"`);
    console.log(`⏰ Cron Job de Fechamento de Vagas configurado para: "${closeCronExpression}"`);

    // Cron Job de Abertura
    cron.schedule(openCronExpression, async () => {
      console.log('⏰ [Cron] Executando abertura automática da escala diária...');
      try {
        await this.wpService.openDailySchedule();
      } catch (err: any) {
        console.error('❌ [Cron] Erro ao abrir escala diária:', err.message);
      }
    });

    // Cron Job de Fechamento
    cron.schedule(closeCronExpression, async () => {
      console.log('⏰ [Cron] Executando fechamento automático da escala diária...');
      try {
        await this.wpService.closeDailySchedule();
      } catch (err: any) {
        console.error('❌ [Cron] Erro ao fechar escala diária:', err.message);
      }
    });
  }
}
