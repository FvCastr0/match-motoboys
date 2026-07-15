import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.post<{ token: string; user: { id: string; username: string } }>('/auth/login', {
        username,
        password,
      });
      
      api.setToken(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação. Verifique seu nome de usuário e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background glow effects */}
      <div style={styles.glowTop} className="pulse-animation"></div>
      <div style={styles.glowBottom}></div>

      <div style={styles.card} className="card-glass glow-red">
        <div style={styles.logoWrapper}>
          <img style={styles.logoImg} src="/match.png" alt="Logo Match Pizza" />
          <h2 style={styles.title}>Painel de Gestão</h2>
          <p style={styles.subtitle}>Entre com seu usuário e senha de administrador</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} style={{ marginRight: 8, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Usuário (Nome)</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                placeholder="Ex: admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                className="login-input"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                className="login-input"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                className="btn-hover-effect"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            style={styles.submitButton} 
            className="btn-hover-effect"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-loader"></span>
            ) : (
              <>
                Entrar no Painel
                <ArrowRight size={18} style={{ marginLeft: 8 }} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#050505',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 9999,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, var(--accent-primary-glow) 0%, transparent 70%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
    opacity: 0.8,
  },
  glowBottom: {
    position: 'absolute',
    bottom: '-10%',
    left: '10%',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(23, 23, 23, 0.4) 0%, transparent 70%)',
    filter: 'blur(30px)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
    margin: '20px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 2,
  },
  logoWrapper: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoImg: {
    width: '130px',
    height: 'auto',
    marginBottom: '20px',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.5px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-secondary)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    borderRadius: '8px',
    backgroundColor: 'rgba(38, 38, 38, 0.4)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
  },
  eyeButton: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px 0 var(--accent-primary-glow)',
    marginTop: '10px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '0.85rem',
    lineHeight: '1.4',
    marginBottom: '16px',
  },
};

// Estilos adicionais para inputs de login
const styleSheet = document.createElement('style');
styleSheet.innerText = `
  .login-input:focus {
    border-color: var(--accent-primary) !important;
    background-color: rgba(30, 30, 30, 0.7) !important;
    box-shadow: 0 0 0 1px var(--accent-primary-border), 0 0 10px var(--accent-primary-glow) !important;
  }
  @media (max-width: 480px) {
    .card-glass {
      padding: 24px !important;
      margin: 16px !important;
    }
  }
`;
document.head.appendChild(styleSheet);
