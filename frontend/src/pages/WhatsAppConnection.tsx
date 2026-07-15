import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, LogOut, Plus, QrCode } from 'lucide-react';

export default function WhatsAppConnection() {
  const [status, setStatus] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token') || 'token_secreto_super_seguro_da_match';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:3000/api/admin/evolution/status', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar status');

      if (data.instance && data.instance.state) {
        setStatus(data.instance.state);
        // If it's connecting, maybe it doesn't have QR yet, but let's check
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
      const res = await fetch('http://localhost:3000/api/admin/evolution/create', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar instância');
      
      // Se criou com sucesso e retornou QR (na criação as vezes retorna base64)
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
      const res = await fetch('http://localhost:3000/api/admin/evolution/connect', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao conectar/gerar QR');
      
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
      const res = await fetch('http://localhost:3000/api/admin/evolution/logout', {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao desconectar');
      
      setQrCode(null);
      await fetchStatus();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) return <div style={styles.center}>Verificando status da conexão...</div>;
    if (error) return <div style={{ ...styles.center, color: 'var(--accent-error)' }}>{error}</div>;

    if (status === 'not_found' || status === 'unknown') {
      return (
        <div style={styles.card} className="card-glass">
          <Smartphone size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
          <h2>Instância Não Encontrada</h2>
          <p style={styles.description}>A instância do WhatsApp não foi criada na Evolution API.</p>
          <button onClick={handleCreate} disabled={actionLoading} style={styles.btnPrimary}>
            <Plus size={16} style={{ marginRight: 8 }} />
            {actionLoading ? 'Criando...' : 'Criar Instância'}
          </button>
        </div>
      );
    }

    if (status === 'open') {
      return (
        <div style={styles.card} className="card-glass">
          <Smartphone size={48} color="var(--accent-success)" style={{ marginBottom: 16 }} />
          <h2 style={{ color: 'var(--accent-success)' }}>WhatsApp Conectado</h2>
          <p style={styles.description}>Sua instância está pronta e operando corretamente.</p>
          <button onClick={handleLogout} disabled={actionLoading} style={styles.btnDanger}>
            <LogOut size={16} style={{ marginRight: 8 }} />
            {actionLoading ? 'Desconectando...' : 'Desconectar'}
          </button>
        </div>
      );
    }

    // Se a instância existe mas não está logada
    return (
      <div style={styles.card} className="card-glass glow-red">
        <QrCode size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
        <h2>Aguardando Conexão</h2>
        <p style={styles.description}>Escaneie o QR Code com seu WhatsApp para conectar.</p>
        
        {qrCode ? (
          <div style={styles.qrContainer}>
            <img src={qrCode} alt="QR Code" style={styles.qrImage} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>
              QR Code expira em alguns segundos. Clique em atualizar se necessário.
            </p>
          </div>
        ) : null}

        <div style={styles.actionRow}>
          <button onClick={handleConnect} disabled={actionLoading} style={styles.btnPrimary}>
            <RefreshCw size={16} style={{ marginRight: 8 }} />
            {actionLoading ? 'Gerando...' : (qrCode ? 'Atualizar QR Code' : 'Gerar QR Code')}
          </button>
          <button onClick={handleLogout} disabled={actionLoading} style={styles.btnDanger}>
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
        <button onClick={fetchStatus} style={styles.btnRefresh} title="Atualizar Status">
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
  content: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 40,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px',
    maxWidth: 500,
    width: '100%',
    textAlign: 'center',
  },
  description: {
    color: 'var(--text-secondary)',
    margin: '8px 0 24px 0',
    lineHeight: 1.5,
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
  btnDanger: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--accent-error)',
    border: '1px solid var(--accent-error)',
    padding: '10px 20px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
  actionRow: {
    display: 'flex',
    gap: 16,
    marginTop: 24,
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    fontSize: '1.1rem',
  },
  qrContainer: {
    background: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  qrImage: {
    width: 250,
    height: 250,
  },
};
