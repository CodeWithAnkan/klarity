import React, { useEffect, useState, useCallback } from 'react'
import api from '../lib/api.js'
import { Plus, Folder, FolderOpen, Loader2, RefreshCw, Trash2 } from 'lucide-react'

export default function SpacesSidebar({ onSelectSpace, activeSpaceId, onDeleteSpace, spaces = [], onSpacesChange }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingSpaceId, setDeletingSpaceId] = useState(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false) // State for showing/hiding the create form
  const [creatingLoading, setCreatingLoading] = useState(false)

  // --- THIS IS THE FIX ---
  // Define fetchSpaces outside useEffect so it can be reused.
  // useCallback is used for optimization to prevent re-creating the function on every render.
  const fetchSpaces = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      console.log('Fetching spaces...')
      const res = await api.get('/api/spaces')
      console.log('Spaces loaded:', res.data)
      onSpacesChange?.(res.data || [])
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to load spaces'
      console.error('Error loading spaces:', errorMsg, err)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [onSpacesChange])
  // --- END OF FIX ---

  useEffect(() => {
    // If no spaces are provided, fetch them on initial component mount.
    if (spaces.length === 0) {
      fetchSpaces()
    }
  }, [spaces.length, fetchSpaces]) // fetchSpaces is now a dependency

  const createSpace = async (e) => {
    e?.preventDefault()
    if (!newName.trim()) return
    setCreatingLoading(true)
    try {
      const res = await api.post('/api/spaces', { name: newName.trim() })
      const created = res.data
      onSpacesChange?.([created, ...spaces])
      setNewName('')
      setCreating(false) // Hide form after creation
      onSelectSpace?.(created)
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to create space')
    } finally {
      setCreatingLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-200">Spaces</span>
        <div className="flex items-center gap-2">
          <button onClick={fetchSpaces} title="Refresh"
            className="p-1.5 rounded-md hover:bg-gray-800 text-gray-300">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md px-2.5 py-1.5">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
      </div>

      {creating && (
        <form onSubmit={createSpace} className="p-3 border-b border-gray-800 space-y-2">
          <input
            placeholder="Space name"
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button disabled={creatingLoading}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md px-2.5 py-1.5 disabled:opacity-60">
              {creatingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Create
            </button>
            <button type="button" onClick={() => { setCreating(false); setNewName('') }}
              className="text-xs text-gray-300 hover:text-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Loading...</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-400">{error}</div>
        ) : spaces.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">No spaces yet. Create one to get started.</div>
        ) : (
          <ul>
            {spaces.map((space) => {
              const active = space._id === activeSpaceId
              return (
                <li key={space._id} className="group">
                  <div className="flex items-center">
                    <button
                      onClick={() => onSelectSpace?.(space)}
                      className={`flex-1 flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-800 ${
                        active ? 'bg-gray-800' : ''
                      }`}
                    >
                      {active ? (
                        <FolderOpen className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{space.name}</div>
                        {space.description && (
                          <div className="text-[11px] text-gray-400 truncate">{space.description}</div>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (window.confirm(`Are you sure you want to delete the space "${space.name}" and all its content?`)) {
                          setDeletingSpaceId(space._id)
                          try {
                            await onDeleteSpace(space._id)
                            // Logic to select next space is handled in DashboardPage
                          } finally {
                            setDeletingSpaceId(null)
                          }
                        }
                      }}
                      disabled={deletingSpaceId === space._id}
                      className="p-1.5 mr-1 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-100"
                      title="Delete space"
                    >
                      {deletingSpaceId === space._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}