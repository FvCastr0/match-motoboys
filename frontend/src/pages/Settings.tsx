import React, { useState, useEffect } from 'react';
import { Save, Info } from 'lucide-react';

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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token') || 'token_secreto_super_seguro_da_match';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/admin/rules', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data: Rule[] = await res.json();
        const rulesMap = { ...rules };
        data.forEach((r) => {
          rulesMap[r.diaSemana] = r.vagasPadrao;
        });
        setRules(rulesMap);
      } else if (res.status === 401 || res.status === 403) {
        console.error('Acesso não autorizado às regras.');
      }
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
    try {
      const res = await fetch('http://localhost:3000/api/admin/rules', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          diaSemana,
          vagasPadrao: rules[diaSemana],
        }),
      });

      if (!res.ok) throw new Error('Falha ao salvar regra de vagas.');

      alert(`Vagas para ${DIAS_SEMANA_NOMES[diaSemana]} atualizadas com sucesso!`);
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

      {loading ? (
        <div style={styles.center}>Carregando regras de escala...</div>
      ) : (
        <div style={styles.grid}>
          {/* Caixa Informativa */}
          <div style={{ ...styles.card, gridColumn: 'span 2' }} className="card-glass glow-red">
            <div style={styles.infoBox}>
              <Info size={24} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              <div style={{ marginLeft: 16 }}>
                <h3 style={{ marginBottom: 4 }}>Como funciona a Escala Automática?</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
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
                <input
                  type="number"
                  value={rules[index]}
                  onChange={(e) => handleValueChange(index, Number(e.target.value))}
                  style={styles.input}
                  min={1}
                />
                <button
                  onClick={() => handleSaveRule(index)}
                  disabled={saving === index}
                  style={styles.btnSave}
                >
                  <Save size={16} />
                  <span style={{ marginLeft: 6 }}>{saving === index ? 'Salvando...' : 'Salvar'}</span>
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
    minHeight: 200,
    fontSize: '1.1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 24,
  },
  card: {
    padding: 20,
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
  },
  ruleCard: {
    padding: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
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
  btnSave: {
    background: 'var(--accent-primary)',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
};
