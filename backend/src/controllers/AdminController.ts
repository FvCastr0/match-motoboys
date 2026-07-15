import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { WhatsAppService } from '../services/WhatsAppService';

export class AdminController {
  /**
   * Retorna os motoboys confirmados na escala de hoje em tempo real
   */
  async getTodayScale(req: Request, res: Response) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const schedule = await prisma.schedule.findFirst({
        where: { data: today },
        include: {
          alocados: {
            include: {
              motoboy: true,
            },
            orderBy: {
              confirmadoAs: 'asc', // Ordem de chegada
            },
          },
        },
      });

      if (!schedule) {
        return res.status(404).json({ message: 'Nenhuma escala aberta para a data de hoje.' });
      }

      return res.json({
        id: schedule.id,
        data: schedule.data,
        vagasTotais: schedule.vagasTotais,
        vagasPreenchidas: schedule.vagasPreenchidas,
        status: schedule.status,
        confirmados: schedule.alocados.map((att) => ({
          attendanceId: att.id,
          motoboyId: att.motoboy.id,
          nome: att.motoboy.nome,
          telefone: att.motoboy.telefone,
          confirmadoAs: att.confirmadoAs,
          compareceu: att.compareceu,
        })),
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Retorna o relatório/métricas históricas de todos os motoboys
   */
  async getMotoboysMetrics(req: Request, res: Response) {
    try {
      // 1. Busca todos os motoboys ativos com suas presenças
      const motoboys = await prisma.motoboy.findMany({
        include: {
          presencas: {
            include: {
              schedule: true,
            },
          },
        },
      });

      // 2. Calcula métricas agregadas
      const report = motoboys.map((motoboy) => {
        const totalTurnos = motoboy.presencas.length;

        // Mapear dias da semana mais frequentados
        const diasSemanaCount: Record<string, number> = {
          Domingo: 0,
          Segunda: 0,
          Terca: 0,
          Quarta: 0,
          Quinta: 0,
          Sexta: 0,
          Sabado: 0,
        };

        const nomesDias = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

        motoboy.presencas.forEach((p) => {
          const diaIndex = new Date(p.schedule.data).getDay();
          const diaNome = nomesDias[diaIndex];
          diasSemanaCount[diaNome] = (diasSemanaCount[diaNome] || 0) + 1;
        });

        // Encontra o dia mais frequente
        let diaMaisFrequente = 'Nenhum';
        let maxPresencas = 0;
        Object.entries(diasSemanaCount).forEach(([dia, count]) => {
          if (count > maxPresencas) {
            maxPresencas = count;
            diaMaisFrequente = dia;
          }
        });

        // Frequência de trabalho (presenças vs total de escalas que existiram no banco)
        // Isso nos dá uma taxa percentual útil para a gestão.
        return {
          id: motoboy.id,
          nome: motoboy.nome,
          telefone: motoboy.telefone,
          ativo: motoboy.ativo,
          totalTurnosRealizados: totalTurnos,
          diaMaisFrequente,
          diasSemanaDetalhados: diasSemanaCount,
        };
      });

      return res.json(report);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Registra manualmente a presença do motoboy no turno (Check-in do Admin)
   */
  async recordCheckIn(req: Request, res: Response) {
    const { attendanceId } = req.params;
    const { compareceu } = req.body; // boolean

    try {
      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendanceId as string },
        data: {
          compareceu,
          horarioCheckIn: compareceu ? new Date() : null,
        },
      });

      return res.json({ message: 'Check-in atualizado com sucesso.', updatedAttendance });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Identifica participantes do grupo de WhatsApp que não estão cadastrados como motoboys ativos no sistema
   */
  async auditGroupParticipants(req: Request, res: Response) {
    try {
      const wpService = new WhatsAppService();
      // 1. Busca os participantes do grupo via Evolution API
      const participants = await wpService.getGroupParticipants();
      
      if (!participants || participants.length === 0) {
        return res.json({ message: 'Nenhum participante encontrado no grupo ou grupo vazio.', nonMotoboys: [] });
      }

      // Os participantes podem vir como array de strings, ou array de objetos { id: string }
      const participantJids = participants.map((p: any) => {
        if (typeof p === 'string') return p;
        return p.id || p.jid;
      }).filter(Boolean);

      // 2. Busca todos os motoboys cadastrados e ativos
      const motoboys = await prisma.motoboy.findMany({
        where: { ativo: true },
        select: { telefone: true, nome: true }
      });

      const motoboyTelefones = new Set(motoboys.map(m => m.telefone));

      // 3. Filtra os participantes do WhatsApp que NÃO estão cadastrados como motoboys ativos
      const nonMotoboys = participantJids.filter(jid => !motoboyTelefones.has(jid)).map(jid => {
        const number = jid.split('@')[0];
        return {
          jid,
          number
        };
      });

      return res.json({
        totalParticipants: participantJids.length,
        totalRegisteredMotoboys: motoboys.length,
        totalNonMotoboys: nonMotoboys.length,
        nonMotoboys
      });
    } catch (error: any) {
      console.error('Erro na auditoria do grupo:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }
}
