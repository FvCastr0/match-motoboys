import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middlewares/security';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_match_pizza_system_jwt_token_auth_flow';

export class AuthController {
  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas. Nome de usuário ou senha incorretos.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Credenciais inválidas. Nome de usuário ou senha incorretos.' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (err: any) {
      console.error('Erro no login:', err);
      return res.status(500).json({ error: 'Erro interno ao processar autenticação.' });
    }
  }

  /**
   * GET /api/auth/me
   */
  async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }
    return res.json({ user: req.user });
  }
}
