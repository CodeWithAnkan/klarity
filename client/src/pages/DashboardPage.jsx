import api from '../lib/api.js';
import React, { useState, useCallback, useEffect } from 'react'
import SpacesSidebar from '../ui/SpacesSidebar.jsx'
import ContentFeed from '../ui/ContentFeed.jsx'
import ChatPanel from '../ui/ChatPanel.jsx'
import { LogOut, MessageSquare, X } from 'lucide-react'
import Footer from '../components/Footer'

export default function DashboardPage({ onLogout }) {
  const [activeSpaceId, setActiveSpaceId] = useState(null)
  const [activeSpaceName, setActiveSpaceName] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [spaces, setSpaces] = useState([])

  const fetchSpaces = useCallback(async () => {
    try {
      const res = await api.get('/api/spaces')
      setSpaces(res.data || [])
      // If no space is selected, select the first one
      if (!activeSpaceId && res.data?.length > 0) {
        setActiveSpaceId(res.data[0]._id)
        setActiveSpaceName(res.data[0].name)
      }
    } catch (err) {
      console.error('Failed to fetch spaces:', err)
    }
  }, [activeSpaceId])

  useEffect(() => {
    fetchSpaces()
  }, [fetchSpaces])

  const handleDeleteSpace = useCallback(async (spaceId) => {
    if (!spaceId) return
    
    try {
      await api.delete(`/api/spaces/${spaceId}`)
      
      // Update local state
      setSpaces(prev => {
        const updatedSpaces = prev.filter(space => space._id !== spaceId)
        
        // If the deleted space was the active one, select another space
        if (activeSpaceId === spaceId) {
          const nextSpace = updatedSpaces[0] || null
          setActiveSpaceId(nextSpace?._id || null)
          setActiveSpaceName(nextSpace?.name || '')
        }
        
        return updatedSpaces
      })
    } catch (err) {
      console.error('Failed to delete space:', err)
      alert(err?.response?.data?.message || 'Failed to delete space')
    }
  }, [activeSpaceId])

  const handleSelectSpace = useCallback((space) => {
    const spaceId = space?._id || null
    setActiveSpaceId(spaceId)
    setActiveSpaceName(space?.name || '')
  }, [])

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
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

      {/* Three column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Spaces */}
        <aside className="w-64 border-r border-gray-800 bg-gray-900/60 overflow-y-auto">
          <SpacesSidebar 
            onSelectSpace={handleSelectSpace} 
            activeSpaceId={activeSpaceId} 
            onDeleteSpace={handleDeleteSpace}
            spaces={spaces}
            onSpacesChange={setSpaces}
          />
        </aside>

        {/* Middle: Content */}
        <main className="flex-1 overflow-y-auto bg-gray-900">
          <ContentFeed activeSpaceId={activeSpaceId} activeSpaceName={activeSpaceName} />
        </main>

        {/* Right: Chat */}
        {showChat && (
          <aside className="w-full sm:w-96 md:w-[28rem] border-l border-gray-800 bg-gray-900/60 overflow-y-auto">
            <ChatPanel activeSpaceId={activeSpaceId} activeSpaceName={activeSpaceName} />
          </aside>
        )}
      </div>
      <Footer />
    </div>
  )
}
