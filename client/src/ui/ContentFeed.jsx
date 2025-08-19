import React, { useEffect, useState, useCallback, useRef } from 'react'
import api from '../lib/api'
import ContentCard from './ContentCard.jsx'
import { Link2, Loader2, PlusCircle, RefreshCw, UploadCloud, X } from 'lucide-react'

const isUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export default function ContentFeed({ activeSpaceId, activeSpaceName }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchContent = useCallback(async (spaceId) => {
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
  }, [])

  useEffect(() => {
    setItems([])
    if (activeSpaceId) fetchContent(activeSpaceId)
  }, [activeSpaceId, fetchContent])

  const handleDeleteContent = async (contentId) => {
    if (!contentId || !activeSpaceId) return
    
    setDeletingId(contentId)
    try {
      await api.delete(`/content/${contentId}`)
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
    if (!activeSpaceId || (!url.trim() && !file)) return;

    setSubmitting(true);
    setUploadProgress(0);
    
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('spaceId', activeSpaceId);

        await api.post('/content', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          },
          // --- THIS IS THE FIX: Increased timeout for file uploads ---
          timeout: 60000, // 60 seconds
          // --- END OF FIX ---
        });
        setFile(null);
      } else {
        const trimmed = url.trim();
        if (!isUrl(trimmed)) {
          alert("Please enter a valid URL.");
          setSubmitting(false);
          return;
        }
        if (trimmed.length > 2000) {
          alert("The URL is too long.");
          setSubmitting(false);
          return;
        }
        await api.post('/content', { url: trimmed, spaceId: activeSpaceId });
        setUrl('');
      }
      
      await fetchContent(activeSpaceId);

    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to submit content');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        if (selectedFile.type !== 'application/pdf') {
            alert('Only PDF files are supported.');
            return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
            alert('File is too large. Maximum size is 10MB.');
            return;
        }
        setFile(selectedFile);
        setUrl('');
    }
  };


  if (!activeSpaceId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a space to view and add content.
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur border-b border-gray-800">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-400 mr-2">In <span className="text-gray-200 font-medium">{activeSpaceName || 'Selected Space'}</span></div>
            <div className="flex-1 flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
              <Link2 className="w-4 h-4 text-gray-400" />
              <input
                placeholder="Paste an article or YouTube URL..."
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setFile(null); }}
                maxLength={2048} 
              />
            </div>
            <button 
                type="button" 
                onClick={() => fileInputRef.current.click()}
                className="p-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-50"
                title="Upload a PDF"
                disabled={submitting}
            >
                <UploadCloud className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fetchContent(activeSpaceId)}
              disabled={loading || submitting}
              className="p-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-50"
              title="Refresh content"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg px-3 py-2 disabled:opacity-60"
              disabled={submitting || (!url.trim() && !file)}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              Add
            </button>
          </div>
          
          {file && (
            <div className="mt-2 flex items-center justify-between bg-gray-800/50 p-2 rounded-md text-xs">
                <span className="truncate">Selected file: {file.name}</span>
                <button onClick={() => setFile(null)} className="p-1 text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
          )}

          {submitting && file && (
            <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
                <div 
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                ></div>
            </div>
          )}

        </form>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-400">No content yet. Add a URL or PDF to start processing.</div>
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
