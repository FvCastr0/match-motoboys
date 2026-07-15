import { Request, Response } from 'express';
export declare class ScheduleRuleController {
    /**
     * Retorna todas as regras configuradas para os dias da semana (0-6)
     */
    getRules(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Atualiza ou cria a quantidade de vagas predefinidas para um dia da semana
     */
    updateRule(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ScheduleRuleController.d.ts.map