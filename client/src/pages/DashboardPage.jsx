import React, { useState, useCallback, useEffect } from 'react';
import api from '../lib/api.js';
import SpacesSidebar from '../ui/SpacesSidebar.jsx';
import ContentFeed from '../ui/ContentFeed.jsx';
import ChatPanel from '../ui/ChatPanel.jsx';
import { LogOut, MessageSquare, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Footer from '../components/Footer';

// Accept the 'user' prop from App.jsx
export default function DashboardPage({ user, onLogout }) {
  const [activeSpaceId, setActiveSpaceId] = useState(null);
  const [activeSpaceName, setActiveSpaceName] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [allMessages, setAllMessages] = useState({});
  
  // --- NEW: State for the user dropdown menu ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Helper function to get initials from a name for the avatar
  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  // Load chat history from localStorage
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('klarity-chat-history');
      if (savedMessages) setAllMessages(JSON.parse(savedMessages));
    } catch (error) { console.error("Failed to load chat history", error); }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (Object.keys(allMessages).length > 0) {
      localStorage.setItem('klarity-chat-history', JSON.stringify(allMessages));
    }
  }, [allMessages]);

  const fetchSpaces = useCallback(async () => {
    try {
      const res = await api.get('/spaces');
      const fetchedSpaces = res.data || [];
      setSpaces(fetchedSpaces);
      if (!activeSpaceId && fetchedSpaces.length > 0) {
        setActiveSpaceId(fetchedSpaces[0]._id);
        setActiveSpaceName(fetchedSpaces[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch spaces:', err);
    }
  }, [activeSpaceId]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const handleDeleteSpace = useCallback(async (spaceId) => {
    if (!spaceId) return;
    try {
      await api.delete(`/spaces/${spaceId}`);
      setSpaces(prev => {
        const updatedSpaces = prev.filter(space => space._id !== spaceId);
        if (activeSpaceId === spaceId) {
          const nextSpace = updatedSpaces[0] || null;
          setActiveSpaceId(nextSpace?._id || null);
          setActiveSpaceName(nextSpace?.name || '');
        }
        return updatedSpaces;
      });
    } catch (err) {
      console.error('Failed to delete space:', err);
      alert(err?.response?.data?.message || 'Failed to delete space');
    }
  }, [activeSpaceId]);

  const handleSelectSpace = useCallback((space) => {
    const spaceId = space?._id || null;
    setActiveSpaceId(spaceId);
    setActiveSpaceName(space?.name || '');
  }, []);

  const handleSendMessage = async (query) => {
    if (!activeSpaceId) return;
    const userMessage = { role: 'user', content: query };
    const currentMessages = allMessages[activeSpaceId] || [];
    setAllMessages(prev => ({ ...prev, [activeSpaceId]: [...currentMessages, userMessage] }));
    try {
      const res = await api.post(`/spaces/${activeSpaceId}/chat`, { query });
      const aiMessage = { role: 'assistant', content: res.data.answer };
      setAllMessages(prev => ({ ...prev, [activeSpaceId]: [...(prev[activeSpaceId] || []), aiMessage] }));
    } catch (error) {
      console.error("Failed to get AI response", error);
      const errorMessage = { role: 'assistant', content: "Sorry, I couldn't get a response. Please try again." };
      setAllMessages(prev => ({ ...prev, [activeSpaceId]: [...(prev[activeSpaceId] || []), errorMessage] }));
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* --- THIS IS THE FIX: Increased z-index to z-50 --- */}
      <header className="relative z-50 flex items-center justify-between px-4 h-14 border-b border-gray-800 bg-gray-900/80 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white">
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold tracking-tight">Klarity</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowChat(!showChat)} 
            className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white"
            title={showChat ? 'Hide chat' : 'Show chat'}
          >
            {showChat ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            <span className="hidden sm:inline">{showChat ? 'Hide Chat' : 'Chat'}</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white rounded-full p-1 hover:bg-gray-700"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                {user ? getInitials(user.name) : ''}
              </div>
              <span className="hidden sm:inline">Hey, {user?.name}</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }} 
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`border-r border-gray-800 bg-gray-900/60 overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-0 p-0'}`}>
          <SpacesSidebar 
            onSelectSpace={handleSelectSpace} 
            activeSpaceId={activeSpaceId} 
            onDeleteSpace={handleDeleteSpace}
            spaces={spaces}
            onSpacesChange={setSpaces}
          />
        </aside>

        <main className="flex-1 overflow-y-auto bg-gray-900">
          <ContentFeed activeSpaceId={activeSpaceId} activeSpaceName={activeSpaceName} />
        </main>

        {showChat && (
          <aside className="w-full sm:w-96 md:w-[28rem] border-l border-gray-800 bg-gray-900/60 overflow-y-auto">
            <ChatPanel 
              activeSpaceId={activeSpaceId} 
              activeSpaceName={activeSpaceName}
              messages={allMessages[activeSpaceId] || []}
              onSendMessage={handleSendMessage}
            />
          </aside>
        )}
      </div>
      <Footer />
    </div>
  )
}
