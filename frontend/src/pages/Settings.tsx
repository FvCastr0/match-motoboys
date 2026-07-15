import React, { useState, useEffect } from 'react';
import { Save, Info, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface Rule {
  id?: string;
  diaSemana: number;
  vagasPadrao: number;
}

const DIAS_SEMANA_NOMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export default function Settings() {
  const [rules, setRules] = useState<Record<number, number>>({
    0: 10,
    1: 10,
    2: 10,
    3: 10,
    4: 10,
    5: 10,
    6: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await api.get<Rule[]>('/admin/rules');
      const rulesMap = { ...rules };
      data.forEach((r) => {
        rulesMap[r.diaSemana] = r.vagasPadrao;
      });
      setRules(rulesMap);
    } catch (err) {
      console.error('Erro ao buscar regras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSaveRule = async (diaSemana: number) => {
    setSaving(diaSemana);
    setSuccessMsg(null);
    try {
      await api.post('/admin/rules', {
        diaSemana,
        vagasPadrao: rules[diaSemana],
      });

      setSuccessMsg(`Vagas de ${DIAS_SEMANA_NOMES[diaSemana]} salvas com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleValueChange = (diaSemana: number, val: number) => {
    setRules({
      ...rules,
      [diaSemana]: val,
    });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Configurações de Vagas</h1>
          <p style={styles.subtitle}>Defina a quantidade de vagas padrão para a escala de cada dia da semana</p>
        </div>
      </header>

      {successMsg && (
        <div style={styles.toastSuccess}>
          <CheckCircle2 size={18} style={{ marginRight: 8 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={styles.center}>
          <span className="spinner-loader" style={{ marginRight: 12 }}></span>
          Carregando regras de escala...
        </div>
      ) : (
        <div className="grid-responsive-2">
          {/* Caixa Informativa */}
          <div style={{ ...styles.card, ...styles.fullWidthCard }} className="card-glass glow-red">
            <div style={styles.infoBox}>
              <div style={styles.infoIconWrapper}>
                <Info size={24} color="var(--accent-primary)" />
              </div>
              <div style={{ marginLeft: 16 }}>
                <h3 style={{ marginBottom: 6, fontWeight: 700 }}>Como funciona a Escala Automática?</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Ao iniciar um novo dia, a rotina de abertura busca o dia da semana correspondente no calendário e lê as configurações abaixo. A escala diária será criada automaticamente no WhatsApp com o limite definido para aquele dia.
                </p>
              </div>
            </div>
          </div>

          {/* Cards de dias da semana */}
          {DIAS_SEMANA_NOMES.map((nome, index) => (
            <div key={index} style={styles.ruleCard} className="card-glass">
              <div>
                <h3 style={styles.dayTitle}>{nome}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>Vagas Padrão</p>
              </div>
              <div style={styles.actionRow}>
                <div style={styles.inputWrapper}>
                  <input
                    type="number"
                    value={rules[index]}
                    onChange={(e) => handleValueChange(index, Number(e.target.value))}
                    style={styles.input}
                    min={1}
                    className="settings-input"
                  />
                </div>
                <button
                  onClick={() => handleSaveRule(index)}
                  disabled={saving === index}
                  style={styles.btnSave}
                  className="btn-hover-effect"
                >
                  <Save size={16} />
                  <span style={{ marginLeft: 8 }}>{saving === index ? 'Salvando...' : 'Salvar'}</span>
                </button>
              </div>
            </div>
          ))}
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
  card: {
    padding: 24,
  },
  fullWidthCard: {
    gridColumn: '1 / -1',
    borderLeft: '4px solid var(--accent-primary)',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
  },
  infoIconWrapper: {
    background: 'var(--accent-primary-alpha)',
    padding: 12,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--accent-primary-border)',
    flexShrink: 0,
  },
  ruleCard: {
    padding: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  dayTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  inputWrapper: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    padding: '2px 8px',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    padding: '8px 4px',
    width: 60,
    outline: 'none',
    fontWeight: 700,
    fontSize: '0.95rem',
    textAlign: 'center',
  },
  btnSave: {
    background: 'var(--accent-primary)',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 4px 12px var(--accent-primary-glow)',
  },
  toastSuccess: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    backgroundColor: 'var(--accent-success)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.3)',
    zIndex: 9999,
    fontSize: '0.95rem',
    fontWeight: 600,
    animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Injetando animação e estilos adicionais de input no DOM
const settingsStyleSheet = document.createElement('style');
settingsStyleSheet.innerText = `
  .settings-input:focus {
    color: var(--accent-primary) !important;
  }
  @keyframes slideIn {
    from {
      transform: translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(settingsStyleSheet);
