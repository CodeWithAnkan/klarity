import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleAuthed = useCallback((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleSwitchToRegister = () => {
    console.log('Switching to register page');
    navigate('/register');
  };

  const handleSwitchToLogin = () => {
    console.log('Switching to login page');
    navigate('/login');
  };

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <LoginPage onAuthed={handleAuthed} onSwitchToRegister={handleSwitchToRegister} /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <RegisterPage onAuthed={handleAuthed} onSwitchToLogin={handleSwitchToLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <DashboardPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
