import React, { useState, useEffect } from 'react';
import { Play, Check, X, RefreshCw, Users, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface Confirmados {
  attendanceId: string;
  motoboyId: string;
  nome: string;
  telefone: string;
  confirmadoAs: string;
  compareceu: boolean;
}

interface Scale {
  id: string;
  data: string;
  vagasTotais: number;
  vagasPreenchidas: number;
  status: 'ABERTO' | 'FECHADO' | 'CANCELADO';
  confirmados: Confirmados[];
}

export default function Dashboard() {
  const [scale, setScale] = useState<Scale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customVagas, setCustomVagas] = useState<number>(10);
  const [btnLoading, setBtnLoading] = useState(false);

  const fetchTodayScale = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Scale>('/admin/today-scale');
      setScale(data);
    } catch (err: any) {
      if (err.message.includes('404')) {
        setScale(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayScale();
    const interval = setInterval(fetchTodayScale, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenScale = async () => {
    try {
      setBtnLoading(true);
      await api.post('/admin/open-scale', { vagasTotais: customVagas });
      await fetchTodayScale();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCloseScale = async () => {
    if (!window.confirm("Deseja realmente finalizar a escala de hoje? Nenhum outro motoboy poderá se alocar.")) return;
    try {
      setBtnLoading(true);
      await api.post('/admin/close-scale');
      await fetchTodayScale();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCheckIn = async (attendanceId: string, currentCompareceu: boolean) => {
    try {
      await api.patch(`/admin/attendances/${attendanceId}/checkin`, { compareceu: !currentCompareceu });

      if (scale) {
        setScale({
          ...scale,
          confirmados: scale.confirmados.map((item) =>
            item.attendanceId === attendanceId ? { ...item, compareceu: !currentCompareceu } : item
          ),
        });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const percentPreenchido = scale ? Math.round((scale.vagasPreenchidas / scale.vagasTotais) * 100) : 0;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Escala Diária</h1>
          <p style={styles.subtitle}>Gerenciamento de motoboys e vagas do dia em tempo real</p>
        </div>
        <button onClick={fetchTodayScale} style={styles.btnRefresh} title="Atualizar dados" className="btn-hover-effect">
          <RefreshCw size={20} />
        </button>
      </header>

      {loading && !scale ? (
        <div style={styles.center}>
          <span className="spinner-loader" style={{ marginRight: 12 }}></span>
          Carregando dados da escala...
        </div>
      ) : error && !scale ? (
        <div style={{ ...styles.center, color: 'var(--accent-error)' }}>
          <AlertTriangle size={24} style={{ marginRight: 12 }} />
          {error}
        </div>
      ) : !scale ? (
        <div style={styles.noScaleContainer} className="card-glass glow-red">
          <div style={styles.iconCircleRed} className="pulse-animation">
            <Users size={32} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Nenhuma Escala Ativa Hoje</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center', maxWidth: 440, lineHeight: 1.6, fontSize: '0.95rem' }}>
            Não há uma chamada em andamento para hoje. Defina a quantidade de vagas abaixo para abrir a escala e notificar os motoboys no grupo.
          </p>
          <div style={styles.openForm}>
            <div style={styles.inputWrapper}>
              <span style={styles.inputLabel}>Vagas:</span>
              <input
                type="number"
                value={customVagas}
                onChange={(e) => setCustomVagas(Number(e.target.value))}
                style={styles.input}
                min={1}
              />
            </div>
            <button onClick={handleOpenScale} disabled={btnLoading} style={styles.btnPrimary} className="btn-hover-effect">
              <Play size={16} style={{ marginRight: 8 }} />
              {btnLoading ? 'Abrindo...' : 'Abrir Escala Agora'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-responsive-sidebar-content">
          {/* Card de Progresso */}
          <div style={styles.card} className="card-glass glow-red">
            <h2 style={styles.cardTitle}>Vagas de Hoje</h2>
            <div style={styles.progressContainer}>
              <div style={styles.progressText}>
                <span style={styles.progressBig}>{scale.vagasPreenchidas} / {scale.vagasTotais}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Vagas preenchidas ({percentPreenchido}%)</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: `${Math.min(percentPreenchido, 100)}%` }} />
              </div>
            </div>
            <div style={styles.scaleMeta}>
              <span>Status: <strong style={{ color: scale.status === 'ABERTO' ? 'var(--accent-success)' : 'var(--accent-error)' }}>{scale.status}</strong></span>
              <span>Data: {new Date(scale.data).toLocaleDateString('pt-BR')}</span>
            </div>
            {scale.status === 'ABERTO' && (
              <button
                onClick={handleCloseScale}
                disabled={btnLoading}
                style={{ ...styles.btnDanger, marginTop: 20 }}
                className="btn-hover-effect"
              >
                <X size={16} style={{ marginRight: 8 }} />
                {btnLoading ? 'Finalizando...' : 'Finalizar Escala'}
              </button>
            )}
          </div>

          {/* Lista de Motoboys */}
          <div style={styles.card} className="card-glass">
            <h2 style={styles.cardTitle}>Fila de Presença (Ordem de Chegada)</h2>
            {scale.confirmados.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.iconCircleGray}>
                  <Clock size={32} color="var(--text-secondary)" />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: 8, fontWeight: 600 }}>Nenhum Motoboy Alocado</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 360, margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Aguardando confirmações automáticas vindas do grupo de WhatsApp dos entregadores parceiros.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Posição</th>
                      <th style={styles.th}>Nome</th>
                      <th style={styles.th}>WhatsApp</th>
                      <th style={styles.th}>Confirmado Em</th>
                      <th style={styles.th}>Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scale.confirmados.map((item, index) => (
                      <tr key={item.attendanceId} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={styles.badgeIndex}>{index + 1}º</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nome}</span>
                        </td>
                        <td style={styles.td}>{item.telefone.split('@')[0]}</td>
                        <td style={styles.td}>{new Date(item.confirmadoAs).toLocaleTimeString('pt-BR')}</td>
                        <td style={styles.td}>
                          <button
                            onClick={() => handleCheckIn(item.attendanceId, item.compareceu)}
                            style={{
                              ...styles.btnCheckIn,
                              backgroundColor: item.compareceu ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: item.compareceu ? 'var(--accent-success)' : 'var(--accent-error)',
                              border: `1px solid ${item.compareceu ? 'var(--accent-success)' : 'var(--accent-error)'}`,
                            }}
                            className="btn-hover-effect"
                          >
                            {item.compareceu ? (
                              <>
                                <Check size={14} style={{ marginRight: 4 }} />
                                Confirmado
                              </>
                            ) : (
                              <>
                                <X size={14} style={{ marginRight: 4 }} />
                                Ausente
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 16,
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
  btnRefresh: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: 12,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 280,
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
  },
  noScaleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 32px',
    maxWidth: 600,
    margin: '40px auto',
    textAlign: 'center',
  },
  iconCircleRed: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'var(--accent-primary-alpha)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--accent-primary-border)',
    marginBottom: 20,
  },
  iconCircleGray: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
    marginBottom: 16,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  openForm: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    padding: '4px 12px',
  },
  inputLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    marginRight: 8,
  },
  input: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    padding: '8px 0',
    width: 50,
    outline: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    textAlign: 'center',
  },
  btnPrimary: {
    background: 'var(--accent-primary)',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 12px var(--accent-primary-glow)',
  },
  card: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: 20,
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: 12,
    color: 'var(--text-primary)',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    margin: '20px 0',
  },
  progressText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  progressBig: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: 'var(--accent-primary)',
  },
  progressBarBg: {
    background: 'var(--bg-tertiary)',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    background: 'linear-gradient(90deg, var(--accent-primary), #f97316)',
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.4s ease',
  },
  scaleMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: 'auto',
    paddingTop: 16,
    borderTop: '1px solid var(--border-color)',
  },
  emptyState: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    padding: '48px 0',
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
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
  },
  td: {
    padding: '16px',
    fontSize: '0.95rem',
  },
  badgeIndex: {
    background: 'var(--bg-tertiary)',
    color: 'var(--accent-primary)',
    padding: '4px 8px',
    borderRadius: 6,
    fontSize: '0.8rem',
    fontWeight: 700,
  },
  btnCheckIn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: 20,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
    outline: 'none',
  },
  btnDanger: {
    background: 'rgba(239, 68, 68, 0.12)',
    color: 'var(--accent-error)',
    border: '1px solid var(--accent-error)',
    padding: '10px 20px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.2s ease',
  },
};
