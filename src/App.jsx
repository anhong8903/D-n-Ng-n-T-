import React, { useState } from 'react';
import { useApp } from './Store';
import LoginView from './components/LoginView';
import ProfileView from './components/ProfileView';
import BillView from './components/BillView';
import SummaryView from './components/SummaryView';
import { Receipt, PieChart, User, LogOut } from 'lucide-react';

function App() {
  const { user, logout } = useApp();
  const [activeTab, setActiveTab] = useState('bill'); // 'bill', 'summary', 'profile'

  if (!user) {
    return <LoginView />;
  }

  return (
    <div style={{ width: '100%', paddingBottom: '80px' }}>
      <header className="flex-between mb-4" style={{ padding: '1rem', background: 'var(--glass-bg)', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 0 }}>Split Bill</h1>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Xin chào, <strong style={{color: 'var(--primary)'}}>{user.username}</strong>!</p>
        </div>
        <button onClick={logout} className="btn" style={{ width: 'auto', padding: '0.5rem', background: 'transparent', color: 'var(--text-muted)' }}>
          <LogOut size={20} />
        </button>
      </header>

      <main>
        {activeTab === 'bill' && <BillView />}
        {activeTab === 'summary' && <SummaryView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        justifyContent: 'center',
        padding: '0.5rem 1rem',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '600px' }}>
          <NavButton 
            active={activeTab === 'bill'} 
            onClick={() => setActiveTab('bill')} 
            icon={<Receipt />} 
            label="Hóa đơn" 
          />
          <NavButton 
            active={activeTab === 'summary'} 
            onClick={() => setActiveTab('summary')} 
            icon={<PieChart />} 
            label="Tổng kết" 
          />
          <NavButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            icon={<User />} 
            label="Cài đặt" 
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        background: 'transparent',
        border: 'none',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        cursor: 'pointer',
        padding: '0.5rem',
        flex: 1,
        transition: 'color 0.3s'
      }}
    >
      {React.cloneElement(icon, { size: 24, style: { transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s' } })}
      <span style={{ fontSize: '0.75rem', fontWeight: active ? '600' : '400' }}>{label}</span>
    </button>
  );
}

export default App;
