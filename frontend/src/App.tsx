import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Settings2, Smartphone } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Metrics from './pages/Metrics';
import Settings from './pages/Settings';
import WhatsAppConnection from './pages/WhatsAppConnection';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const isLinkActive = (path: string) => location.pathname === path;

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <img style={styles.logoImg} src="/match.png" alt="Logo" />
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
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/whatsapp" element={<WhatsAppConnection />} />
        </Routes>
      </Layout>
    </Router>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg-primary)',
  },
  sidebar: {
    width: 260,
    background: 'rgba(23, 23, 23, 0.5)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'center',
    padding: 24,
    backdropFilter: 'blur(10px)',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    filter: 'blur(10px)',
    opacity: 0.6,
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: 800,
    letterSpacing: '-0.5px',
    zIndex: 1,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
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
  main: {
    flex: 1,
    padding: '0 40px',
    overflowY: 'auto',
  },
  contentWrapper: {
    maxWidth: 1200,
    margin: '0 auto',
  },
  logoImg: {
    width: '50%',
    height: 'auto',
  },
};
