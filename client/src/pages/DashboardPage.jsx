import React, { useState, useCallback, useEffect } from 'react';
import api from '../lib/api.js';
import SpacesSidebar from '../ui/SpacesSidebar.jsx';
import ContentFeed from '../ui/ContentFeed.jsx';
import ChatPanel from '../ui/ChatPanel.jsx';
import { LogOut, MessageSquare, X } from 'lucide-react';
import Footer from '../components/Footer';

export default function DashboardPage({ onLogout }) {
  const [activeSpaceId, setActiveSpaceId] = useState(null);
  const [activeSpaceName, setActiveSpaceName] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [spaces, setSpaces] = useState([]);
  
  // --- NEW: State for all chat messages, keyed by spaceId ---
  const [allMessages, setAllMessages] = useState({});

  // --- NEW: Load all chat history from localStorage on initial render ---
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem('klarity-chat-history');
      if (savedMessages) {
        setAllMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error("Failed to load chat history from localStorage", error);
      setAllMessages({});
    }
  }, []);

  // --- NEW: Save chat history to localStorage whenever it changes ---
  useEffect(() => {
    // We don't want to save the initial empty object before it's been populated
    if (Object.keys(allMessages).length > 0) {
      try {
        localStorage.setItem('klarity-chat-history', JSON.stringify(allMessages));
      } catch (error) {
        console.error("Failed to save chat history to localStorage", error);
      }
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

  // --- NEW: Function to handle sending a message ---
  const handleSendMessage = async (query) => {
    if (!activeSpaceId) return;

    const userMessage = { role: 'user', content: query };
    const currentMessages = allMessages[activeSpaceId] || [];

    // Update state immediately for a responsive UI
    setAllMessages(prev => ({
      ...prev,
      [activeSpaceId]: [...currentMessages, userMessage]
    }));

    try {
      const res = await api.post(`spaces/${activeSpaceId}/chat`, { query });
      const aiMessage = { role: 'assistant', content: res.data.answer };

      // Add the AI's response to the state
      setAllMessages(prev => {
        const updatedMessagesForSpace = [...(prev[activeSpaceId] || []) , aiMessage];
        // Ensure user message isn't duplicated if API is fast
        const finalMessages = Array.from(new Map(updatedMessagesForSpace.map(item => [item.content, item])).values());
        return { ...prev, [activeSpaceId]: finalMessages };
      });
    } catch (error) {
      console.error("Failed to get AI response", error);
      const errorMessage = { role: 'assistant', content: "Sorry, I couldn't get a response. Please try again." };
      setAllMessages(prev => ({
        ...prev,
        [activeSpaceId]: [...(prev[activeSpaceId] || []), errorMessage]
      }));
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 h-14 border-b border-gray-800 bg-gray-900/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold tracking-tight">Klarity</span>
          <span className="text-xs text-gray-400 ml-2">Command Center</span>
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
          <button onClick={onLogout} className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-gray-800 bg-gray-900/60 overflow-y-auto">
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
              messages={allMessages[activeSpaceId] || []} // Pass only relevant messages
              onSendMessage={handleSendMessage} // Pass the handler
            />
          </aside>
        )}
      </div>
      <Footer />
    </div>
  )
}
