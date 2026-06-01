import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { RAGAnswer, Citation } from '../../types'
import { queryDocument, getKeyPoints } from '../../api/documents'

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

interface Props { docId: string }

export function RAGChat({ docId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [keypoints, setKeypoints] = useState<string[] | null>(null)
  const [loadingKP, setLoadingKP] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: question }])
    setLoading(true)
    try {
      const result: RAGAnswer = await queryDocument(docId, question)
      setMessages((m) => [...m, { role: 'assistant', content: result.answer, citations: result.citations }])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Request failed.'
      setMessages((m) => [...m, { role: 'assistant', content: `⚠ ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  async function handleKeyPoints() {
    setLoadingKP(true)
    try {
      setKeypoints(await getKeyPoints(docId))
    } catch (e: unknown) {
      setKeypoints([`⚠ ${e instanceof Error ? e.message : 'Could not extract key points.'}`])
    } finally {
      setLoadingKP(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* key points */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border-light)', flexShrink: 0 }}>
        <button
          onClick={handleKeyPoints}
          disabled={loadingKP}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-ui)', textDecoration: 'underline' }}
        >
          {loadingKP ? 'Extracting…' : 'Extract key points'}
        </button>
      </div>

      {/* messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {keypoints && (
          <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Key Points</div>
            {keypoints.map((kp, i) => (
              <div key={i} style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', padding: '2px 0', lineHeight: '1.6' }}>{kp}</div>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', flexShrink: 0, paddingTop: '2px', minWidth: '28px' }}>
              {msg.role === 'user' ? 'you' : 'ai'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', lineHeight: '1.65' }}>
                {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
              </div>
              {msg.citations && msg.citations.length > 0 && (
                <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {msg.citations.map((c, ci) => (
                    <span key={ci} style={{ fontSize: '10px', fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: '2px' }}>
                      {c.tag} {c.filename} p.{c.page}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', minWidth: '28px' }}>ai</span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>Thinking…</span>
          </div>
        )}

        {messages.length === 0 && !keypoints && (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>
            Ask anything about this document
          </div>
        )}
      </div>

      {/* input */}
      <form onSubmit={handleSend} style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          style={{
            flex: 1, padding: '7px 10px',
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: '2px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'var(--font-ui)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '7px 14px',
            background: loading || !input.trim() ? 'var(--bg-surface)' : 'var(--text-primary)',
            border: 'none', borderRadius: '2px',
            color: 'var(--bg-base)',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontFamily: 'var(--font-ui)', fontWeight: 700,
          }}
        >
          Ask
        </button>
      </form>
    </div>
  )
}
