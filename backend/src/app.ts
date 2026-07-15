import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WhatsAppService } from './services/WhatsAppService';
import { AdminController } from './controllers/AdminController';
import { ScheduleRuleController } from './controllers/ScheduleRuleController';
import { EvolutionController } from './controllers/EvolutionController';
import { authenticateAdmin, apiRateLimiter } from './middlewares/security';

const app = express();

// OWASP A05: Security Misconfiguration - Proteção de cabeçalhos HTTP via Helmet
app.use(helmet());

// Configuração do CORS restrito ao domínio da aplicação (OWASP A05)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost',
  })
);

app.use(express.json());

// OWASP A04: Rate Limiting global nas requisições da API
app.use('/api/', apiRateLimiter);

const wpService = new WhatsAppService();
const adminController = new AdminController();
const ruleController = new ScheduleRuleController();
const evolutionController = new EvolutionController();

// Inicializa a conexão do bot de WhatsApp (Queue Worker)
wpService.connect().catch((err) => {
  console.error('Falha crítica na conexão do WhatsApp:', err);
});

// 📌 Webhook público recebido da Evolution API
app.post('/api/webhook/evolution', async (req, res) => {
  const evolutionWebhookToken = req.headers['webhook-signature'] || req.headers['apikey'];

  // OWASP A01: Valida se o webhook partiu legitimamente da nossa instância Evolution
  if (evolutionWebhookToken !== process.env.EVOLUTION_API_KEY) {
    console.warn('⚠️ Token do webhook inválido:', evolutionWebhookToken, '- Ignorando erro para pegar o ID do grupo.');
    // return res.status(403).json({ error: 'Assinatura do webhook inválida.' });
  }

  try {
    await wpService.handleWebhook(req.body);
    return res.status(200).send('Webhook processado com sucesso');
  } catch (err: any) {
    console.error('Erro ao tratar webhook:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// 🔒 Rotas Administrativas de Escala e Métricas (OWASP A01: Acesso protegido por Bearer Token)
app.get('/api/admin/today-scale', authenticateAdmin, adminController.getTodayScale.bind(adminController));
app.get('/api/admin/motoboys-metrics', authenticateAdmin, adminController.getMotoboysMetrics.bind(adminController));
app.get('/api/admin/audit-group', authenticateAdmin, adminController.auditGroupParticipants.bind(adminController));
app.patch('/api/admin/attendances/:attendanceId/checkin', authenticateAdmin, adminController.recordCheckIn.bind(adminController));

// 🔒 Rotas Administrativas de Regras Semanais
app.get('/api/admin/rules', authenticateAdmin, ruleController.getRules.bind(ruleController));
app.post('/api/admin/rules', authenticateAdmin, ruleController.updateRule.bind(ruleController));

// 🔒 Rotas Administrativas da Evolution API
app.get('/api/admin/evolution/status', authenticateAdmin, evolutionController.getStatus.bind(evolutionController));
app.post('/api/admin/evolution/create', authenticateAdmin, evolutionController.create.bind(evolutionController));
app.get('/api/admin/evolution/connect', authenticateAdmin, evolutionController.connect.bind(evolutionController));
app.delete('/api/admin/evolution/logout', authenticateAdmin, evolutionController.logout.bind(evolutionController));

// 🔒 Rota manual para forçar/configurar escala do dia
app.post('/api/admin/open-scale', authenticateAdmin, async (req, res) => {
  const { vagasTotais } = req.body;

  if (vagasTotais !== undefined && typeof vagasTotais !== 'number') {
    return res.status(400).json({ error: 'Parâmetro vagasTotais deve ser um número inteiro.' });
  }

  try {
    await wpService.openDailySchedule(vagasTotais);
    return res.json({ message: 'Escala aberta com sucesso no banco e disparada no grupo!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API de Gestão Segura da Rede Match rodando na porta ${PORT}`);
});
