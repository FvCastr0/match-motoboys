import { ScheduleService } from './ScheduleService';
import { queuePrivateMessage } from '../jobs/queue';
import { setupWhatsAppWorker } from '../jobs/worker';
import { prisma } from '../prisma';

export class WhatsAppService {
  private scheduleService = new ScheduleService();
  private evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  private evolutionKey = process.env.EVOLUTION_API_KEY || 'global_apikey';
  private instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'match_instance';

  constructor() { }

  /**
   * Conecta o serviço e inicializa o worker de envio enfileirado (BullMQ)
   */
  async connect() {
    console.log('🔄 Inicializando serviço do WhatsApp com a Evolution API...');
    setupWhatsAppWorker(this.sendDirectMessage.bind(this));
  }

  /**
   * Trata o webhook recebido da Evolution API quando uma nova mensagem é gerada
   */
  async handleWebhook(body: any) {
    // A Evolution API envia no evento "messages.upsert"
    if (body.event !== 'messages.upsert') return;

    const msg = body.data;
    if (!msg || msg.key?.fromMe) return;

    const remoteJid = msg.key?.remoteJid;

    // --- CÓDIGO INJETADO PARA DESCOBRIR O ID DO GRUPO ---
    if (remoteJid && remoteJid.endsWith('@g.us')) {
      console.log('\n=======================================');
      console.log('📬 MENSAGEM RECEBIDA EM UM GRUPO!');
      console.log('ID do Grupo:', remoteJid);
      console.log('Quem mandou:', msg.key?.participant || remoteJid);
      console.log('=======================================\n');
    }
    // ---------------------------------------------------

    if (!remoteJid || remoteJid !== process.env.WHATSAPP_GROUP_ID) return;

    // Recupera o texto da mensagem
    const messageContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    if (messageContent.trim().toUpperCase() === 'EU') {
      // msg.key.participant identifica quem enviou a mensagem dentro do grupo
      const senderJid = msg.key?.participant || remoteJid;
      const pushName = msg.pushName || '';

      try {
        console.log(`Motoboy ${senderJid} (${pushName}) tentando confirmar vaga...`);
        const today = new Date();
        const result = await this.scheduleService.confirmAttendance(senderJid, today, pushName);

        if (result.status === 'SUCCESS') {
          // Enfileira a DM no BullMQ para rate limit
          await queuePrivateMessage(
            senderJid,
            `✅ Olá ${result.motoboyNome}, sua vaga está confirmada para hoje! Horário de início: 18:30.`
          );

          if (result.lotou) {
            await this.sendGroupMessage('🚨 *Vagas encerradas para hoje!* A escala está cheia.');
          }
        } else if (result.status === 'FULL') {
          await queuePrivateMessage(senderJid, '❌ Poxa, a escala de hoje já atingiu o limite de vagas! Tente amanhã.');
        }
      } catch (error: any) {
        console.error(`Erro ao confirmar motoboy ${senderJid}:`, error.message);
      }
    }
  }

  /**
   * Abre a escala diária no banco de dados e dispara a mensagem no grupo de WhatsApp
   */
  async openDailySchedule(vagasTotais?: number) {
    const today = new Date();
    const diaSemana = today.getDay();
    today.setHours(0, 0, 0, 0);

    let limiteVagas = vagasTotais;

    if (!limiteVagas) {
      const rule = await prisma.scheduleRule.findUnique({ where: { diaSemana } });
      limiteVagas = rule ? rule.vagasPadrao : 10;
    }

    try {
      await prisma.schedule.upsert({
        where: { data: today },
        update: { vagasTotais: limiteVagas, status: 'ABERTO' },
        create: {
          data: today,
          vagasTotais: limiteVagas,
          status: 'ABERTO',
        },
      });

      console.log(`📅 Escala criada com ${limiteVagas} vagas (Dia da Semana: ${diaSemana}).`);

      const mensagemEscala = `🔔 *ATENÇÃO MOTOBOYS: ESCALA ABERTA!* 🔔\n\n` +
        `Temos *${limiteVagas} vagas* para rodar hoje.\n` +
        `Para garantir a sua vaga, responda a esta mensagem apenas com *EU*.\n\n` +
        `Boa rota a todos! 🚀`;

      try {
        await this.sendGroupMessage(mensagemEscala);
      } catch (msgErr: any) {
        console.warn('⚠️ A escala foi aberta no banco, mas não foi possível avisar no grupo:', msgErr.message);
      }
    } catch (err: any) {
      console.error('Erro ao abrir escala diária no banco:', err.message);
    }
  }

  /**
   * Finaliza a escala diária ativa e envia um aviso no grupo do WhatsApp
   */
  async closeDailySchedule() {
    try {
      const closedSchedule = await this.scheduleService.closeActiveSchedule();
      if (closedSchedule) {
        console.log(`📅 Escala do dia ${closedSchedule.data.toISOString().split('T')[0]} finalizada com sucesso no banco.`);
        try {
          await this.sendGroupMessage('🔒 *A escala de hoje está oficialmente encerrada.*');
        } catch (msgErr: any) {
          console.warn('⚠️ A escala foi fechada no banco, mas não foi possível avisar no grupo:', msgErr.message);
        }
        return closedSchedule;
      } else {
        console.log('📅 Nenhuma escala ativa encontrada para finalizar.');
        return null;
      }
    } catch (err: any) {
      console.error('Erro ao finalizar escala diária no banco:', err.message);
      throw err;
    }
  }

  /**
   * Envia uma mensagem HTTP POST para a Evolution API no grupo
   */
  async sendGroupMessage(text: string) {
    if (!process.env.WHATSAPP_GROUP_ID) return;
    await this.postToEvolution('/message/sendText', {
      number: process.env.WHATSAPP_GROUP_ID,
      text,
    });
  }

  /**
   * Envia uma mensagem HTTP POST para a Evolution API em DM (utilizada pelo worker)
   */
  async sendDirectMessage(jid: string, text: string) {
    // Remove o sufixo de servidor para envio se a Evolution API o exigir limpo ou mantém JID
    await this.postToEvolution('/message/sendText', {
      number: jid,
      text,
    });
  }

  /**
   * Auxiliar para fazer chamadas autenticadas na Evolution API
   */
  private async postToEvolution(endpoint: string, payload: any) {
    const url = `${this.evolutionUrl}${endpoint}/${this.instanceName}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.evolutionKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro Evolution API HTTP ${response.status}: ${errorText}`);
      }

      console.log(`✉️ Mensagem enviada via Evolution para ${payload.number}`);
    } catch (err: any) {
      console.error(`❌ Erro de comunicação com a Evolution API:`, err.message);
      throw err;
    }
  }

  /**
   * Obtém o estado de conexão da instância
   */
  async getConnectionState() {
    const url = `${this.evolutionUrl}/instance/connectionState/${this.instanceName}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.evolutionKey,
        },
      });




      if (response.status === 404) {
        return { instance: { state: 'not_found' } };
      }
      if (!response.ok) throw new Error('Falha ao obter status');
      return await response.json();
    } catch (err: any) {
      console.error('Erro ao checar conexão:', err.message);
      throw err;
    }
  }

  /**
   * Conecta na instância (retorna QR Code em base64 se necessário)
   */
  async connectInstance() {
    const url = `${this.evolutionUrl}/instance/connect/${this.instanceName}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.evolutionKey,
        },
      });
      if (!response.ok) throw new Error('Falha ao conectar instância');
      return await response.json();
    } catch (err: any) {
      console.error('Erro ao conectar:', err.message);
      throw err;
    }
  }

  /**
   * Cria uma nova instância na Evolution API
   */
  async createInstance() {
    const url = `${this.evolutionUrl}/instance/create`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.evolutionKey,
        },
        body: JSON.stringify({
          instanceName: this.instanceName,
          token: this.evolutionKey,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Falha ao criar instância: ${response.status} - ${errText}`);
      }
      return await response.json();
    } catch (err: any) {
      console.error('Erro ao criar instância:', err.message);
      throw err;
    }
  }

  /**
   * Desconecta a instância (Logout)
   */
  async logoutInstance() {
    const url = `${this.evolutionUrl}/instance/logout/${this.instanceName}`;
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': this.evolutionKey,
        },
      });
      if (!response.ok) throw new Error('Falha ao deslogar instância');
      return await response.json();
    } catch (err: any) {
      console.error('Erro ao fazer logout:', err.message);
      throw err;
    }
  }

  /**
   * Obtém os participantes do grupo configurado a partir da Evolution API
   */
  async getGroupParticipants(): Promise<any[]> {
    if (!process.env.WHATSAPP_GROUP_ID) {
      throw new Error('WHATSAPP_GROUP_ID não configurado no .env.');
    }
    const groupJid = encodeURIComponent(process.env.WHATSAPP_GROUP_ID);
    const url = `${this.evolutionUrl}/group/participants/${this.instanceName}?groupJid=${groupJid}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.evolutionKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar participantes do grupo: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // A Evolution API retorna um objeto ou array contendo participantes.
      // Dependendo da versão, pode vir como array direto ou { participants: [...] } ou [{ id: "...", admin: boolean }]
      // Vamos tentar mapear e retornar o array.
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.participants)) {
        return data.participants;
      }
      return [];
    } catch (err: any) {
      console.error('Erro ao buscar participantes do grupo na Evolution API:', err.message);
      throw err;
    }
  }
}
