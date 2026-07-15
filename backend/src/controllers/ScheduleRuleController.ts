import { Request, Response } from 'express';
import { prisma } from '../prisma';

export class ScheduleRuleController {
  /**
   * Retorna todas as regras configuradas para os dias da semana (0-6)
   */
  async getRules(req: Request, res: Response) {
    try {
      const rules = await prisma.scheduleRule.findMany({
        orderBy: { diaSemana: 'asc' }
      });
      return res.json(rules);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Atualiza ou cria a quantidade de vagas predefinidas para um dia da semana
   */
  async updateRule(req: Request, res: Response) {
    const { diaSemana, vagasPadrao } = req.body;

    if (diaSemana === undefined || vagasPadrao === undefined || typeof diaSemana !== 'number' || typeof vagasPadrao !== 'number') {
      return res.status(400).json({ error: 'Parâmetros diaSemana (number 0-6) e vagasPadrao (number) são obrigatórios.' });
    }

    if (diaSemana < 0 || diaSemana > 6) {
      return res.status(400).json({ error: 'O diaSemana deve ser um número entre 0 (Domingo) e 6 (Sábado).' });
    }

    try {
      const rule = await prisma.scheduleRule.upsert({
        where: { diaSemana },
        update: { vagasPadrao },
        create: { diaSemana, vagasPadrao },
      });

      return res.json({ message: 'Regra de escala atualizada com sucesso.', rule });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
