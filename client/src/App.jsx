import React, { useEffect, useState, useCallback } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

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
      {view === 'login' && (
        <LoginPage onSwitchToRegister={() => setView('register')} onAuthed={handleAuthed} />
      )}
      {view === 'register' && (
        <RegisterPage onSwitchToLogin={() => setView('login')} onAuthed={handleAuthed} />
      )}
      {view === 'dashboard' && (
        <DashboardPage user={user} onLogout={handleLogout} />
      )}
    </div>
  )
}
