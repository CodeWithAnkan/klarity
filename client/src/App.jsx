import React, { useEffect, useState, useCallback } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setView('dashboard');
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setView('login');
      }
    }
  }, []);

  const handleAuthed = useCallback((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setView('dashboard');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setView('login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {(() => {
        if (view === 'login') {
          return <LoginPage onSwitchToRegister={() => setView('register')} onAuthed={handleAuthed} />;
        }
        if (view === 'register') {
          return <RegisterPage onSwitchToLogin={() => setView('login')} onAuthed={handleAuthed} />;
        }
        if (view === 'dashboard' && user) {
          return <DashboardPage user={user} onLogout={handleLogout} />;
        }
        return <NotFoundPage />;
      })()}
    </div>
  )
}
