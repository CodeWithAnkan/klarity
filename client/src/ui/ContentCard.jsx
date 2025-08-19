import React, { useState } from 'react'
import { ExternalLink, Trash2, Loader2, AlertTriangle, X, Info } from 'lucide-react'

// Helper to check if a string is a valid URL
const isUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

function StatusDot({ status }) {
  const color = status === 'processed' ? 'bg-emerald-500' : status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
  return (
    <div className="flex-shrink-0 flex items-center gap-2 text-xs text-gray-400">
      <span className={`flex-shrink-0 w-2 h-2 rounded-full ${color}`} />
      <span className="truncate">{label}</span>
    </div>
  )
}

export default function ContentCard({ item, onDelete, isDeleting = false }) {
  // --- THIS IS THE FIX: Only parse valid URLs ---
  const title = item?.title || (isUrl(item?.url) ? new URL(item.url).hostname : item.url || 'Untitled');
  
  const summary = item?.summary
  const url = item?.url
  const created = item?.createdAt ? new Date(item.createdAt).toLocaleString() : ''
  const hasFailed = item?.status === 'failed';
  const isProcessedWithoutSummary = item?.status === 'processed' && !summary;
  const [showSummaryNotice, setShowSummaryNotice] = useState(true);

  return (
    <div className={`bg-gray-800/50 border rounded-lg p-4 hover:border-gray-700 transition ${hasFailed ? 'border-red-500/30' : 'border-gray-800'}`}>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <h3 className="font-medium text-gray-100 truncate">{title}</h3>
              <StatusDot status={item?.status} />
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this item?')) {
                  onDelete?.(item._id);
                }
              }}
              className="text-gray-400 hover:text-red-400 transition-colors p-1 flex-shrink-0"
              title={isDeleting ? 'Deleting...' : 'Delete item'}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {url && isUrl(url) && ( // Only show the link if it's a real URL
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1 text-emerald-400 text-sm hover:underline mt-1 min-w-0"
            >
              <ExternalLink className="flex-shrink-0 w-3.5 h-3.5"/>
              <span className="truncate">{url}</span>
            </a>
          )}
        </div>
      </div>
      
      {hasFailed && item.failureReason ? (
        <div className="mt-3 text-sm text-red-400 bg-red-500/10 p-3 rounded-md flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{item.failureReason}</span>
        </div>
      ) : isProcessedWithoutSummary && showSummaryNotice ? (
        <div className="mt-3 text-sm text-blue-300 bg-blue-500/10 p-3 rounded-md flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="flex-1">The summarization feature is currently disabled in this deployment.</span>
            <button onClick={() => setShowSummaryNotice(false)} className="p-1 -m-1">
                <X className="w-4 h-4" />
            </button>
        </div>
      ) : (
        summary && <p className="text-sm text-gray-300 mt-3 whitespace-pre-line">{summary}</p>
      )}

      {created && <div className="mt-3 text-[11px] text-gray-400">Added {created}</div>}
    </div>
  )
}
