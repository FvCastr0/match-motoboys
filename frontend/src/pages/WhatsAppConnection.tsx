import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, LogOut, Plus, QrCode, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

interface StatusResponse {
  instance?: {
    state?: string;
  };
  error?: string;
}

interface CreateResponse {
  qrcode?: {
    base64?: string;
  };
  error?: string;
}

interface ConnectResponse {
  base64?: string;
  error?: string;
}

export default function WhatsAppConnection() {
  const [status, setStatus] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<StatusResponse>('/admin/evolution/status');
      
      if (data.instance && data.instance.state) {
        setStatus(data.instance.state);
      } else {
        setStatus('unknown');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCreate = async () => {
    try {
      setActionLoading(true);
      const data = await api.post<CreateResponse>('/admin/evolution/create');
      
      if (data.qrcode && data.qrcode.base64) {
        setQrCode(data.qrcode.base64);
        setStatus('qr_ready');
      } else {
        await fetchStatus();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      const data = await api.get<ConnectResponse>('/admin/evolution/connect');
      
      if (data.base64) {
        setQrCode(data.base64);
        setStatus('qr_ready');
      } else {
        await fetchStatus();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setActionLoading(true);
      await api.delete('/admin/evolution/logout');
      setQrCode(null);
      await fetchStatus();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return (
      <div style={styles.center}>
        <span className="spinner-loader" style={{ marginRight: 12 }}></span>
        Verificando status da conexão...
      </div>
    );
    if (error) return (
      <div style={{ ...styles.center, color: 'var(--accent-error)' }}>
        <AlertCircle size={24} style={{ marginRight: 12 }} />
        {error}
      </div>
    );

    if (status === 'not_found' || status === 'unknown') {
      return (
        <div style={styles.card} className="card-glass glow-red">
          <div style={styles.iconCircleRed} className="pulse-animation">
            <Smartphone size={32} color="var(--accent-primary)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }}>Instância Não Encontrada</h2>
          <p style={styles.description}>
            A conexão com a API do WhatsApp não está inicializada. Crie uma nova instância para obter o código de pareamento.
          </p>
          <button onClick={handleCreate} disabled={actionLoading} style={styles.btnPrimary} className="btn-hover-effect">
            {actionLoading ? (
              <span className="spinner-loader" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }}></span>
            ) : (
              <Plus size={16} style={{ marginRight: 8 }} />
            )}
            {actionLoading ? 'Criando Instância...' : 'Criar Instância'}
          </button>
        </div>
      );
    }

    if (status === 'open') {
      return (
        <div style={styles.card} className="card-glass glow-success">
          <div style={styles.iconCircleSuccess}>
            <CheckCircle size={32} color="var(--accent-success)" />
          </div>
          <h2 style={{ color: 'var(--accent-success)', fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }}>Conectado com Sucesso</h2>
          <p style={styles.description}>
            O painel está integrado com a API do WhatsApp. O envio e processamento de confirmações de escalas estão ativos.
          </p>
          <button onClick={handleLogout} disabled={actionLoading} style={styles.btnDanger} className="btn-hover-effect">
            {actionLoading ? (
              <span className="spinner-loader" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }}></span>
            ) : (
              <LogOut size={16} style={{ marginRight: 8 }} />
            )}
            {actionLoading ? 'Desconectando...' : 'Desconectar Dispositivo'}
          </button>
        </div>
      );
    }

    // Se a instância existe mas não está logada
    return (
      <div style={styles.card} className="card-glass glow-red">
        <div style={styles.iconCircleRed} className="pulse-animation">
          <QrCode size={32} color="var(--accent-primary)" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 12 }}>Aguardando Conexão</h2>
        <p style={styles.description}>
          Escaneie o QR Code abaixo usando o leitor de QR Code no menu de Dispositivos Conectados do seu WhatsApp.
        </p>
        
        {qrCode ? (
          <div style={styles.qrContainer}>
            <img src={qrCode} alt="WhatsApp QR Code" style={styles.qrImage} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 12, maxWidth: 220 }}>
              O QR Code expira rapidamente. Atualize se a conexão falhar.
            </p>
          </div>
        ) : (
          <div style={styles.qrPlaceholder}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>QR Code ainda não foi gerado.</p>
          </div>
        )}

        <div style={styles.actionRow}>
          <button onClick={handleConnect} disabled={actionLoading} style={styles.btnPrimary} className="btn-hover-effect">
            {actionLoading ? (
              <span className="spinner-loader" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }}></span>
            ) : (
              <RefreshCw size={16} style={{ marginRight: 8 }} />
            )}
            {actionLoading ? 'Processando...' : (qrCode ? 'Atualizar QR Code' : 'Gerar QR Code')}
          </button>
          <button onClick={handleLogout} disabled={actionLoading} style={styles.btnDanger} className="btn-hover-effect">
            <LogOut size={16} style={{ marginRight: 8 }} />
            Desconectar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Conexão WhatsApp</h1>
          <p style={styles.subtitle}>Gerencie a conexão da sua instância com a Evolution API</p>
        </div>
        <button onClick={fetchStatus} style={styles.btnRefresh} title="Atualizar Status" className="btn-hover-effect">
          <RefreshCw size={20} />
        </button>
      </header>

      <div style={styles.content}>
        {renderContent()}
      </div>
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
  content: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 20,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 32px',
    maxWidth: 480,
    width: '100%',
    textAlign: 'center',
  },
  iconCircleRed: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'var(--accent-primary-alpha)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--accent-primary-border)',
    marginBottom: 20,
  },
  iconCircleSuccess: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(16, 185, 129, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    marginBottom: 20,
  },
  description: {
    color: 'var(--text-secondary)',
    margin: '0 auto 24px auto',
    lineHeight: 1.6,
    fontSize: '0.95rem',
    maxWidth: 380,
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
    justifyContent: 'center',
    boxShadow: '0 4px 12px var(--accent-primary-glow)',
  },
  btnDanger: {
    background: 'rgba(239, 68, 68, 0.12)',
    color: 'var(--accent-error)',
    border: '1px solid var(--accent-error)',
    padding: '12px 24px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    display: 'flex',
    gap: 12,
    marginTop: 24,
    width: '100%',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 280,
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
  },
  qrContainer: {
    background: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  },
  qrImage: {
    width: '100%',
    maxWidth: 220,
    height: 'auto',
    aspectRatio: '1',
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    background: 'rgba(255,255,255,0.02)',
    border: '1px dashed var(--border-color)',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
