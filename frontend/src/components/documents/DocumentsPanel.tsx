import { useEffect, useState } from 'react'
import type { Document } from '../../types'
import { deleteDocument, getDocumentFileUrl, generateDocTopics } from '../../api/documents'
import { createNote } from '../../api/notes'
import { useDocumentsStore } from '../../store/documentsStore'
import { useNotesStore } from '../../store/notesStore'
import { DocumentUpload } from './DocumentUpload'
import { PDFViewer } from './PDFViewer'
import { RAGChat } from './RAGChat'
import { CitationCard } from './CitationCard'

export function DocumentsPanel() {
  const { docs, reload, addDocs, removeDoc } = useDocumentsStore()
  const { openTab, upsertNote } = useNotesStore()
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [view, setView] = useState<'pdf' | 'chat'>('pdf')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [topicsBusy, setTopicsBusy] = useState(false)

  useEffect(() => { reload() }, [])

  async function handleDelete(doc: Document, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Remove "${doc.filename}" from Research?`)) return
    await deleteDocument(doc.id)
    removeDoc(doc.id)
    setPicked((p) => { const n = new Set(p); n.delete(doc.id); return n })
    if (selectedDoc?.id === doc.id) setSelectedDoc(null)
  }

  function togglePick(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function generateTopicsNote() {
    const ids = picked.size > 0 ? [...picked] : docs.map((d) => d.id)
    if (ids.length === 0) return
    setTopicsBusy(true)
    try {
      const res = await generateDocTopics(ids)
      const md =
        `# Key Topics\n\n${res.overview}\n\n` +
        res.topics.map((t) => `- ${t}`).join('\n')
      const note = await createNote({ title: 'Key Topics', content: md, tags: ['research'] })
      upsertNote(note)
      openTab(note.id)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not generate key topics.')
    } finally {
      setTopicsBusy(false)
    }
  }

  // ---- single-document view ----
  if (selectedDoc) {
    const isPaper = selectedDoc.kind === 'paper'
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setSelectedDoc(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-ui)', padding: 0 }}>
            ← back
          </button>
          <span style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-ui)', color: 'var(--text-primary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {selectedDoc.filename}
          </span>
          {(['pdf', 'chat'] as const).map((v) => (
            (v === 'pdf' && !selectedDoc.has_pdf && isPaper) ? null : (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  background: 'none', border: 'none', padding: '0 0 1px',
                  fontSize: '12px', fontFamily: 'var(--font-ui)',
                  color: view === v ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer', textTransform: 'uppercase',
                  borderBottom: `1px solid ${view === v ? 'var(--text-primary)' : 'transparent'}`,
                }}
              >
                {v}
              </button>
            )
          ))}
        </div>

        <CitationCard docId={selectedDoc.id} />

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {view === 'pdf' && selectedDoc.has_pdf ? (
            <PDFViewer url={getDocumentFileUrl(selectedDoc.id)} />
          ) : view === 'pdf' && isPaper ? (
            <div style={{ overflowY: 'auto', height: '100%', padding: '18px 22px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginBottom: '8px' }}>
                {(selectedDoc.authors || []).slice(0, 4).join(', ')}{(selectedDoc.authors?.length || 0) > 4 ? ' et al.' : ''}
                {selectedDoc.year ? ` · ${selectedDoc.year}` : ''}{selectedDoc.source ? ` · ${selectedDoc.source}` : ''}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', lineHeight: 1.7 }}>
                {selectedDoc.abstract || 'No abstract available — open the original to read more.'}
              </div>
              {selectedDoc.url && (
                <a href={selectedDoc.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '14px', color: 'var(--accent-light)', fontSize: '13px', fontFamily: 'var(--font-ui)' }}>
                  Open original ↗
                </a>
              )}
            </div>
          ) : (
            <RAGChat docId={selectedDoc.id} />
          )}
        </div>
      </div>
    )
  }

  // ---- list view ----
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Research Documents
        </span>
      </div>

      <DocumentUpload onUploaded={(doc) => { addDocs([doc]); setSelectedDoc(doc) }} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {docs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 14px', fontSize: '13px', fontFamily: 'var(--font-ui)', fontStyle: 'italic', lineHeight: 1.6 }}>
            No documents yet.<br />Upload a PDF, or select papers in Search and "Add to Research".
          </div>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => { setView(doc.has_pdf ? 'pdf' : (doc.kind === 'paper' ? 'pdf' : 'chat')); setSelectedDoc(doc) }}
              style={{ padding: '9px 12px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <input
                type="checkbox"
                checked={picked.has(doc.id)}
                onClick={(e) => togglePick(doc.id, e)}
                onChange={() => {}}
                style={{ flexShrink: 0, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-faint)', flexShrink: 0, width: '34px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {doc.kind === 'paper' ? 'paper' : 'pdf'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-ui)', color: 'var(--text-primary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {doc.filename}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                  {doc.kind === 'paper'
                    ? `${doc.year || ''}${doc.source ? ` · ${doc.source}` : ''}${doc.has_pdf ? ' · full text' : ' · abstract'}`
                    : `${doc.chunk_count} chunks · ${new Date(doc.created_at).toLocaleDateString()}`}
                </div>
              </div>
              <button onClick={(e) => handleDelete(doc, e)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-ui)' }}>
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {docs.length > 0 && (
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--bg-panel)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
            {picked.size > 0 ? `${picked.size} selected` : 'all documents'}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={generateTopicsNote}
            disabled={topicsBusy}
            style={{
              padding: '7px 14px', background: topicsBusy ? 'var(--bg-surface)' : 'var(--accent)',
              border: 'none', borderRadius: '2px', color: '#fff', fontSize: '13px',
              fontFamily: 'var(--font-ui)', fontWeight: 600, cursor: topicsBusy ? 'not-allowed' : 'pointer',
            }}
          >
            {topicsBusy ? 'Generating…' : 'Generate key topics → note'}
          </button>
        </div>
      )}
    </div>
  )
}
