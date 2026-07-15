import React, { useState, useEffect } from 'react';
import { Play, Check, X, RefreshCw, Users } from 'lucide-react';

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

  // Obtém o token do localStorage para segurança OWASP A01
  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token') || 'token_secreto_super_seguro_da_match';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchTodayScale = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:3000/api/admin/today-scale', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 404) {
          setScale(null);
          return;
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error('Acesso negado. Verifique seu token de acesso nos headers.');
        }
        throw new Error('Erro ao buscar escala de hoje.');
      }
      const data = await res.json();
      setScale(data);
    } catch (err: any) {
      setError(err.message);
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
      const res = await fetch('http://localhost:3000/api/admin/open-scale', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ vagasTotais: customVagas }),
      });
      if (!res.ok) throw new Error('Não foi possível abrir a escala.');
      await fetchTodayScale();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCheckIn = async (attendanceId: string, currentCompareceu: boolean) => {
    try {
      const res = await fetch(`http://localhost:3000/api/admin/attendances/${attendanceId}/checkin`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ compareceu: !currentCompareceu }),
      });
      if (!res.ok) throw new Error('Erro ao alterar presença.');

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
        <button onClick={fetchTodayScale} style={styles.btnRefresh} title="Atualizar dados">
          <RefreshCw size={20} />
        </button>
      </header>

      {loading && !scale ? (
        <div style={styles.center}>Carregando dados da escala...</div>
      ) : error && !scale ? (
        <div style={{ ...styles.center, color: 'var(--accent-error)' }}>{error}</div>
      ) : !scale ? (
        <div style={styles.noScaleContainer} className="card-glass glow-red">
          <Users size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
          <h2>Nenhuma Escala Ativa Hoje</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 24px 0', textAlign: 'center', maxWidth: 400 }}>
            Inicie a escala de hoje enviando o disparo automático no grupo de WhatsApp com as vagas abaixo.
          </p>
          <div style={styles.openForm}>
            <label style={{ marginRight: 12 }}>Quantidade de Vagas:</label>
            <input
              type="number"
              value={customVagas}
              onChange={(e) => setCustomVagas(Number(e.target.value))}
              style={styles.input}
              min={1}
            />
            <button onClick={handleOpenScale} disabled={btnLoading} style={styles.btnPrimary}>
              <Play size={16} style={{ marginRight: 8 }} />
              {btnLoading ? 'Abrindo...' : 'Abrir Escala Agora'}
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {/* Card de Progresso */}
          <div style={styles.card} className="card-glass glow-red">
            <h2 style={styles.cardTitle}>Vagas de Hoje</h2>
            <div style={styles.progressContainer}>
              <div style={styles.progressText}>
                <span style={styles.progressBig}>{scale.vagasPreenchidas} / {scale.vagasTotais}</span>
                <span style={{ color: 'var(--text-secondary)' }}>Vagas preenchidas ({percentPreenchido}%)</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: `${Math.min(percentPreenchido, 100)}%` }} />
              </div>
            </div>
            <div style={styles.scaleMeta}>
              <span>Status: <strong style={{ color: scale.status === 'ABERTO' ? 'var(--accent-success)' : 'var(--accent-error)' }}>{scale.status}</strong></span>
              <span>Data: {new Date(scale.data).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          {/* Lista de Motoboys */}
          <div style={{ ...styles.card, gridColumn: 'span 2' }} className="card-glass">
            <h2 style={styles.cardTitle}>Fila de Presença (Ordem de Chegada)</h2>
            {scale.confirmados.length === 0 ? (
              <div style={styles.emptyState}>Nenhum motoboy alocado para hoje ainda.</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>WhatsApp</th>
                    <th style={styles.th}>Confirmado Em</th>
                    <th style={styles.th}>Comparecimento (Check-in)</th>
                  </tr>
                </thead>
                <tbody>
                  {scale.confirmados.map((item, index) => (
                    <tr key={item.attendanceId} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <span style={styles.badgeIndex}>{index + 1}</span>
                          {item.nome}
                        </div>
                      </td>
                      <td style={styles.td}>{item.telefone.split('@')[0]}</td>
                      <td style={styles.td}>{new Date(item.confirmadoAs).toLocaleTimeString('pt-BR')}</td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleCheckIn(item.attendanceId, item.compareceu)}
                          style={{
                            ...styles.btnCheckIn,
                            backgroundColor: item.compareceu ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: item.compareceu ? 'var(--accent-success)' : 'var(--accent-error)',
                            border: `1px solid ${item.compareceu ? 'var(--accent-success)' : 'var(--accent-error)'}`,
                          }}
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
    transition: '0.2s ease',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    fontSize: '1.1rem',
  },
  noScaleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 24px',
    maxWidth: 600,
    margin: '40px auto',
  },
  openForm: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    gap: 8,
  },
  input: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '10px 14px',
    borderRadius: 8,
    width: 80,
    outline: 'none',
  },
  btnPrimary: {
    background: 'var(--accent-primary)',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: 24,
  },
  card: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: 20,
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: 12,
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
    height: 12,
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
    padding: '40px 0',
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
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  badgeIndex: {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  btnCheckIn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: 20,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
    outline: 'none',
  },
};
