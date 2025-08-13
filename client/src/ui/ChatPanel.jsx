import React, { useEffect, useMemo, useRef, useState } from 'react'
import api from '../lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, Send, Loader2 } from 'lucide-react'

function pickReply(data) {
  if (!data) return ''
  if (typeof data === 'string') return data
  return (
    data.reply ||
    data.answer ||
    data.message ||
    data.text ||
    data.response ||
    ''
  )
}

function Message({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
        isUser ? 'bg-emerald-600 text-white' : 'bg-gray-800/70 text-gray-100 border border-gray-800'
      }`}>
        {isUser ? (
          <span>{content}</span>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              pre: ({node, ...props}) => (
                <pre className="bg-black/60 border border-gray-800 rounded-md p-3 overflow-x-auto" {...props} />
              ),
              code: ({inline, className, children, ...props}) => (
                inline
                  ? <code className="bg-gray-900/80 px-1 py-0.5 rounded" {...props}>{children}</code>
                  : <code className={className} {...props}>{children}</code>
              ),
              a: ({...props}) => (
                <a className="text-emerald-400 underline" target="_blank" rel="noreferrer" {...props} />
              )
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}

export default function ChatPanel({ activeSpaceId, activeSpaceName }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me anything about the content in this space.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  const disabled = !activeSpaceId || loading

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Reset chat when switching spaces
    setMessages([{ role: 'assistant', content: `You're chatting in: ${activeSpaceName || 'Selected Space'}.` }])
    setInput('')
  }, [activeSpaceId])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || !activeSpaceId) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await api.post(`/api/spaces/${activeSpaceId}/chat`, { query: userMsg.content })
      const replyText = pickReply(res.data)
      setMessages((prev) => [...prev, { role: 'assistant', content: replyText || '...' }])
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Something went wrong'
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-gray-800 bg-gray-900/80">
        <div className="p-1.5 rounded-md bg-emerald-600/20 border border-emerald-600/30">
          <Bot className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-sm">
          <div className="font-medium">AI Chat</div>
          <div className="text-gray-400 text-xs truncate">{activeSpaceName || 'Select a space to start'}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => (
          <Message key={idx} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div className="text-xs text-gray-400 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin"/> Thinking…</div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
          <input
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
            placeholder={activeSpaceId ? 'Ask a question…' : 'Select a space to chat'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!activeSpaceId || loading}
          />
          <button
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-md px-3 py-1.5 disabled:opacity-60"
            type="submit"
            disabled={disabled || !input.trim()}
            title={activeSpaceId ? 'Send' : 'Select a space'}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  )
}
