import { Request, Response, NextFunction } from 'express';
/**
 * Middleware para validar se a requisição possui o token correto no Header
 */
export declare function authenticateAdmin(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
/**
 * Limitador de taxa de requisições para evitar abusos e força bruta nas rotas (OWASP A04: Insecure Design)
 */
export declare const apiRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=security.d.ts.map