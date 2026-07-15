import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Settings2, Smartphone, LogOut, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Metrics from './pages/Metrics';
import Settings from './pages/Settings';
import WhatsAppConnection from './pages/WhatsAppConnection';
import Login from './pages/Login';
import { api } from './services/api';

// Componente para proteger rotas administrativas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = api.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLinkActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    api.removeToken();
    navigate('/login');
  };

  // Fecha o menu lateral quando o usuário muda de página (no celular)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div style={styles.layout}>
      {/* Mobile Top Header */}
      <header style={styles.mobileHeader}>
        <div style={styles.mobileLogoContainer}>
          <img style={styles.mobileLogoImg} src="/match.png" alt="Logo Match Pizza" />
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          style={styles.mobileMenuToggle}
          aria-label="Toggle Menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Backdrop Overlay on Mobile */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          style={styles.backdrop}
        />
      )}

      {/* Sidebar */}
      <aside 
        style={{
          ...styles.sidebar,
          ...(sidebarOpen ? styles.sidebarOpenMobile : {}),
        }}
        className="sidebar-responsive"
      >
        <div style={styles.logoContainer}>
          <img style={styles.logoImg} src="/match.png" alt="Logo Match Pizza" />
        </div>

        <nav style={styles.nav}>
          <Link
            to="/"
            style={{
              ...styles.navLink,
              ...(isLinkActive('/') ? styles.navLinkActive : {}),
            }}
          >
            <LayoutDashboard size={18} />
            <span style={{ marginLeft: 12 }}>Painel Diário</span>
          </Link>

          <Link
            to="/metrics"
            style={{
              ...styles.navLink,
              ...(isLinkActive('/metrics') ? styles.navLinkActive : {}),
            }}
          >
            <BarChart3 size={18} />
            <span style={{ marginLeft: 12 }}>Métricas</span>
          </Link>

          <Link
            to="/settings"
            style={{
              ...styles.navLink,
              ...(isLinkActive('/settings') ? styles.navLinkActive : {}),
            }}
          >
            <Settings2 size={18} />
            <span style={{ marginLeft: 12 }}>Vagas Semanais</span>
          </Link>

          <Link
            to="/whatsapp"
            style={{
              ...styles.navLink,
              ...(isLinkActive('/whatsapp') ? styles.navLinkActive : {}),
            }}
          >
            <Smartphone size={18} />
            <span style={{ marginLeft: 12 }}>WhatsApp / API</span>
          </Link>
        </nav>

        {/* Botão de Logout no final da barra lateral */}
        <div style={styles.logoutWrapper}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} />
            <span style={{ marginLeft: 12 }}>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={styles.main}>
        <div style={styles.contentWrapper}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rota Pública de Login */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Privadas e Protegidas */}
        <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/metrics" element={<ProtectedRoute><Layout><Metrics /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        <Route path="/whatsapp" element={<ProtectedRoute><Layout><WhatsAppConnection /></Layout></ProtectedRoute>} />

        {/* Fallback de redirecionamento */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Estilos responsivos injetados via tag style global
const responsiveStyles = `
  @media (max-width: 768px) {
    .sidebar-responsive {
      position: fixed !important;
      top: 0 !important;
      left: -260px !important;
      height: 100vh !important;
      z-index: 1001 !important;
      width: 260px !important;
      box-shadow: 5px 0 25px rgba(0, 0, 0, 0.8) !important;
    }
  }
`;
const styleSheet = document.createElement('style');
styleSheet.innerText = responsiveStyles;
document.head.appendChild(styleSheet);

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    background: 'rgba(18, 18, 18, 0.85)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: 24,
    backdropFilter: 'blur(16px)',
    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    flexShrink: 0,
  },
  sidebarOpenMobile: {
    left: '0 !important',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
  },
  mobileHeader: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: 64,
    background: 'rgba(18, 18, 18, 0.9)',
    borderBottom: '1px solid var(--border-color)',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    zIndex: 999,
    backdropFilter: 'blur(10px)',
  },
  mobileLogoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  mobileLogoImg: {
    height: 36,
    width: 'auto',
  },
  mobileMenuToggle: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 40,
    justifyContent: 'center',
  },
  logoImg: {
    width: '70%',
    maxWidth: 160,
    height: 'auto',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: 8,
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
  },
  navLinkActive: {
    background: 'var(--accent-primary-alpha)',
    color: 'var(--text-primary)',
    border: '1px solid var(--accent-primary-border)',
  },
  logoutWrapper: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: 16,
    marginTop: 16,
  },
  logoutBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: 8,
    color: 'var(--text-secondary)',
    background: 'none',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  main: {
    flex: 1,
    padding: '0 40px',
    overflowY: 'auto',
  },
  contentWrapper: {
    maxWidth: 1200,
    margin: '0 auto',
    paddingTop: 40,
    paddingBottom: 40,
  },
};

// Injeta estilos de layout mobile adicionais no DOM
const globalResponsiveStyles = `
  @media (max-width: 768px) {
    body {
      padding-top: 64px !important;
    }
    header {
      display: flex !important;
    }
    main {
      padding: 0 16px !important;
    }
    div[style*="paddingTop: 40px"] {
      padding-top: 20px !important;
    }
  }
`;
const globalStyleSheet = document.createElement('style');
globalStyleSheet.innerText = globalResponsiveStyles;
document.head.appendChild(globalStyleSheet);
