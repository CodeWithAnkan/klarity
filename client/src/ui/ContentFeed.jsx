import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import ContentCard from './ContentCard.jsx'
import { Link2, Loader2, PlusCircle } from 'lucide-react'

export default function ContentFeed({ activeSpaceId, activeSpaceName }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchContent = async (spaceId) => {
    if (!spaceId) return
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/spaces/${spaceId}/content`)
      setItems(res.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setItems([])
    if (activeSpaceId) fetchContent(activeSpaceId)
  }, [activeSpaceId])

  const handleDeleteContent = async (contentId) => {
    if (!contentId || !activeSpaceId) return
    
    setDeletingId(contentId)
    try {
      await api.delete(`/content/${contentId}`)
      // Remove the deleted item from the UI
      setItems(prev => prev.filter(item => item._id !== contentId))
    } catch (err) {
      console.error('Failed to delete content:', err)
      alert(err?.response?.data?.message || 'Failed to delete content')
    } finally {
      setDeletingId(null)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!activeSpaceId) return
    const trimmed = url.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      const res = await api.post('/content', { url: trimmed, spaceId: activeSpaceId })
      const created = res.data
      // Prepend for quick feedback
      setItems((prev) => [created, ...prev])
      setUrl('')
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to submit content')
    } finally {
      setSubmitting(false)
    }
  }

  if (!activeSpaceId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a space to view and add content.
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Submit URL form */}
      <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur border-b border-gray-800">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="text-sm text-gray-400 mr-2">In <span className="text-gray-200 font-medium">{activeSpaceName || 'Selected Space'}</span></div>
          <div className="flex-1 flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
            <Link2 className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Paste an article or YouTube URL and press Enter"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <button
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg px-3 py-2 disabled:opacity-60"
            disabled={submitting || !url.trim()}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            Add
          </button>
        </form>
      </div>

      {/* Content list */}
      <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-400">No content yet. Add a URL to start processing.</div>
        ) : (
          items.map((it) => (
            <ContentCard 
              key={it._id} 
              item={it} 
              onDelete={handleDeleteContent}
              isDeleting={deletingId === it._id}
            />
          ))
        )}
      </div>
    </div>
  )
}
