import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_match_pizza_system_jwt_token_auth_flow';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ ALERTA DE SEGURANÇA: ADMIN_TOKEN não está definido nas variáveis de ambiente em produção!');
}

/**
 * Middleware para validar se a requisição possui o token correto no Header (JWT ou fallback de Admin)
 */
export function authenticateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Token Bearer ausente ou inválido.' });
  }

  const token = authHeader.split(' ')[1];

  // Fallback para o ADMIN_TOKEN estático se necessário
  if (ADMIN_TOKEN && token === ADMIN_TOKEN) {
    req.user = { id: 'admin-fallback', username: 'admin' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    req.user = {
      id: decoded.id,
      username: decoded.username,
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Acesso negado. Token inválido ou expirado.' });
  }
}

/**
 * Limitador de taxa de requisições para evitar abusos e força bruta nas rotas (OWASP A04: Insecure Design)
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: { error: 'Muitas requisições originadas deste IP, por favor tente novamente após 15 minutos.' },
  standardHeaders: true, // Retorna dados de limite nos headers rate limit padrão
  legacyHeaders: false, // Desabilita headers legado X-RateLimit-*
});
