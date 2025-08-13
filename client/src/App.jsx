import React, { useEffect, useState, useCallback } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

export default function App() {
  const [view, setView] = useState('login') // 'login' | 'register' | 'dashboard'

  // On load, if token exists, go to dashboard
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) setView('dashboard')
  }, [])

  const handleAuthed = useCallback(() => {
    setView('dashboard')
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {view === 'login' && (
        <LoginPage onSwitchToRegister={() => setView('register')} onAuthed={handleAuthed} />
      )}
      {view === 'register' && (
        <RegisterPage onSwitchToLogin={() => setView('login')} onAuthed={handleAuthed} />
      )}
      {view === 'dashboard' && (
        <DashboardPage onLogout={() => { localStorage.removeItem('token'); setView('login') }} />
      )}
    </div>
  )
}
