import { Request, Response } from 'express';
export declare class AdminController {
    /**
     * Retorna os motoboys confirmados na escala de hoje em tempo real
     */
    getTodayScale(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Retorna o relatório/métricas históricas de todos os motoboys
     */
    getMotoboysMetrics(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Registra manualmente a presença do motoboy no turno (Check-in do Admin)
     */
    recordCheckIn(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=AdminController.d.ts.map