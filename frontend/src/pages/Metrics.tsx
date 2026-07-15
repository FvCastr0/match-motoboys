import React, { useState, useEffect } from 'react';
import { Award, Calendar } from 'lucide-react';

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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token') || 'token_secreto_super_seguro_da_match';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:3000/api/admin/motoboys-metrics', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Acesso negado. Token administrativo inválido ou ausente.');
        }
        throw new Error('Erro ao buscar as métricas históricas.');
      }
      const data = await res.json();
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
        <div style={styles.center}>Carregando métricas históricas...</div>
      ) : error ? (
        <div style={{ ...styles.center, color: 'var(--accent-error)' }}>{error}</div>
      ) : metrics.length === 0 ? (
        <div style={styles.center}>Nenhum dado histórico registrado até o momento.</div>
      ) : (
        <div style={styles.layout}>
          {/* Card Destaque */}
          {destaque && destaque.totalTurnosRealizados > 0 && (
            <div style={styles.destaqueCard} className="card-glass glow-success">
              <div style={styles.destaqueHeader}>
                <Award size={32} color="var(--accent-success)" />
                <h3 style={{ marginLeft: 12 }}>Parceiro Destaque</h3>
              </div>
              <p style={styles.destaqueName}>{destaque.nome}</p>
              <div style={styles.destaqueStat}>
                <span style={styles.destaqueStatVal}>{destaque.totalTurnosRealizados}</span>
                <span style={{ color: 'var(--text-secondary)' }}>Turnos realizados no total</span>
              </div>
              <div style={styles.destaqueFooter}>
                <Calendar size={14} style={{ marginRight: 6 }} />
                <span>Mais frequente às: <strong>{destaque.diaMaisFrequente}s</strong></span>
              </div>
            </div>
          )}

          {/* Tabela de Performance */}
          <div style={styles.tableCard} className="card-glass">
            <h2 style={styles.cardTitle}>Desempenho Geral</h2>
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
                      <span style={{ fontWeight: 600 }}>{item.nome}</span>
                    </td>
                    <td style={styles.td}>{item.telefone.split('@')[0]}</td>
                    <td style={styles.td}>
                      <div style={styles.turnosBadge}>{item.totalTurnosRealizados} turnos</div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                        {item.diaMaisFrequente}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        color: item.ativo ? 'var(--accent-success)' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 700
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
    minHeight: 200,
    fontSize: '1.1rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 2.5fr',
    gap: 24,
    alignItems: 'start',
  },
  destaqueCard: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 24,
  },
  destaqueHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 20,
  },
  destaqueName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: 8,
  },
  destaqueStat: {
    display: 'flex',
    flexDirection: 'column',
    margin: '20px 0',
  },
  destaqueStatVal: {
    fontSize: '3rem',
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
    marginTop: 'auto',
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
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  td: {
    padding: '16px',
    fontSize: '0.95rem',
  },
  turnosBadge: {
    background: 'var(--accent-primary-alpha)',
    color: 'var(--accent-primary)',
    padding: '4px 10px',
    borderRadius: 6,
    display: 'inline-block',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
};
