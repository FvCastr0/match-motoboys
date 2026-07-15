import React, { useState, useEffect } from 'react';
import { Award, Calendar, AlertCircle, BarChart3, TrendingUp } from 'lucide-react';
import { api } from '../services/api';

interface DiasSemanaDetalhados {
  Domingo: number;
  Segunda: number;
  Terca: number;
  Quarta: number;
  Quinta: number;
  Sexta: number;
  Sabado: number;
}

interface MotoboyMetrics {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  totalTurnosRealizados: number;
  diaMaisFrequente: string;
  diasSemanaDetalhados: DiasSemanaDetalhados;
}

export default function Metrics() {
  const [metrics, setMetrics] = useState<MotoboyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<MotoboyMetrics[]>('/admin/motoboys-metrics');
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const destaque = metrics.reduce<MotoboyMetrics | null>((acc, item) => {
    if (!acc) return item;
    return item.totalTurnosRealizados > acc.totalTurnosRealizados ? item : acc;
  }, null);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Métricas e Desempenho</h1>
          <p style={styles.subtitle}>Visão geral da frequência e consistência dos motoboys parceiros</p>
        </div>
      </header>

      {loading ? (
        <div style={styles.center}>
          <span className="spinner-loader" style={{ marginRight: 12 }}></span>
          Carregando métricas históricas...
        </div>
      ) : error ? (
        <div style={{ ...styles.center, color: 'var(--accent-error)' }}>
          <AlertCircle size={24} style={{ marginRight: 12 }} />
          {error}
        </div>
      ) : metrics.length === 0 ? (
        <div style={styles.noDataContainer} className="card-glass">
          <BarChart3 size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <h3>Sem Registros</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 8 }}>
            Nenhum turno ou confirmação foi computada nas escalas ainda.
          </p>
        </div>
      ) : (
        <div className="grid-responsive-sidebar-content">
          {/* Card Destaque */}
          {destaque && destaque.totalTurnosRealizados > 0 ? (
            <div style={styles.destaqueCard} className="card-glass glow-success">
              <div style={styles.destaqueHeader}>
                <div style={styles.iconCircleSuccess} className="pulse-animation">
                  <Award size={32} color="var(--accent-success)" />
                </div>
                <div style={{ marginLeft: 16 }}>
                  <span style={styles.destaqueLabel}>PARCEIRO DESTAQUE</span>
                  <h3 style={styles.destaqueName}>{destaque.nome}</h3>
                </div>
              </div>

              <div style={styles.destaqueStat}>
                <span style={styles.destaqueStatVal}>{destaque.totalTurnosRealizados}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Turnos concluídos</span>
              </div>

              <div style={styles.destaqueFooter}>
                <Calendar size={16} style={{ marginRight: 8, color: 'var(--accent-success)' }} />
                <span>Mais frequente às <strong>{destaque.diaMaisFrequente}s</strong></span>
              </div>
            </div>
          ) : (
            <div style={styles.destaqueCardEmpty} className="card-glass">
              <TrendingUp size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <h4>Aguardando Líder</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: 6 }}>
                Os dados de turnos serão compilados assim que os motoboys comparecerem às escalas.
              </p>
            </div>
          )}

          {/* Tabela de Performance */}
          <div style={styles.tableCard} className="card-glass">
            <h2 style={styles.cardTitle}>Desempenho Geral</h2>
            <div className="table-responsive">
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome do Motoboy</th>
                    <th style={styles.th}>WhatsApp</th>
                    <th style={styles.th}>Total de Turnos</th>
                    <th style={styles.th}>Dia Preferido</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((item) => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nome}</span>
                      </td>
                      <td style={styles.td}>{item.telefone.split('@')[0]}</td>
                      <td style={styles.td}>
                        <div style={styles.turnosBadge}>{item.totalTurnosRealizados} turnos</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                          {item.diaMaisFrequente}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          color: item.ativo ? 'var(--accent-success)' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: item.ativo ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                          padding: '4px 8px',
                          borderRadius: 4,
                          border: `1px solid ${item.ativo ? 'rgba(16, 185, 129, 0.15)' : 'var(--border-color)'}`
                        }}>
                          {item.ativo ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px 0',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 280,
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '64px 32px',
    textAlign: 'center',
  },
  destaqueCard: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 280,
  },
  destaqueCardEmpty: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    borderStyle: 'dashed',
  },
  destaqueHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  iconCircleSuccess: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  destaqueLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--accent-success)',
    letterSpacing: '1px',
    display: 'block',
    marginBottom: 4,
  },
  destaqueName: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  destaqueStat: {
    display: 'flex',
    flexDirection: 'column',
    margin: '24px 0',
  },
  destaqueStatVal: {
    fontSize: '3.5rem',
    fontWeight: 800,
    color: 'var(--accent-success)',
    lineHeight: 1,
    marginBottom: 4,
  },
  destaqueFooter: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    borderTop: '1px solid var(--border-color)',
    paddingTop: 16,
  },
  tableCard: {
    padding: 24,
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: 20,
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: 12,
    color: 'var(--text-primary)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.85rem',
    borderBottom: '1px solid var(--border-color)',
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.02)',
  },
  td: {
    padding: '16px',
    fontSize: '0.95rem',
  },
  turnosBadge: {
    background: 'var(--accent-primary-alpha)',
    color: 'var(--accent-primary)',
    padding: '4px 12px',
    borderRadius: 6,
    display: 'inline-block',
    fontWeight: 600,
    fontSize: '0.85rem',
    border: '1px solid var(--accent-primary-border)',
  },
};
