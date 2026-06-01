import { useEffect, useState } from 'react'
import type { Document } from '../../types'
import { listDocuments, deleteDocument, getDocumentFileUrl } from '../../api/documents'
import { DocumentUpload } from './DocumentUpload'
import { PDFViewer } from './PDFViewer'
import { RAGChat } from './RAGChat'
import { CitationCard } from './CitationCard'

export function DocumentsPanel() {
  const [docs, setDocs] = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [view, setView] = useState<'pdf' | 'chat'>('pdf')

  useEffect(() => { listDocuments().then(setDocs) }, [])

  async function handleDelete(doc: Document, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete "${doc.filename}"?`)) return
    await deleteDocument(doc.id)
    if (selectedDoc?.id === doc.id) setSelectedDoc(null)
    listDocuments().then(setDocs)
  }

  if (selectedDoc) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
        {/* doc header */}
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setSelectedDoc(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-serif)', padding: 0 }}
          >
            ← back
          </button>
          <span style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {selectedDoc.filename}
          </span>
          {(['pdf', 'chat'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: 'none', border: 'none',
                padding: '0 0 1px',
                fontSize: '12px', fontFamily: 'var(--font-serif)',
                color: view === v ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer', textTransform: 'uppercase',
                borderBottom: `1px solid ${view === v ? 'var(--text-primary)' : 'transparent'}`,
              }}
            >
              {v}
            </button>
          ))}
        </div>

        <CitationCard docId={selectedDoc.id} />

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {view === 'pdf' ? (
            <PDFViewer url={getDocumentFileUrl(selectedDoc.id)} />
          ) : (
            <RAGChat docId={selectedDoc.id} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg-panel)', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Research Documents
        </span>
      </div>

      <DocumentUpload onUploaded={(doc) => { setDocs((d) => [doc, ...d]); setSelectedDoc(doc) }} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {docs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 14px', fontSize: '13px', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            No documents yet
          </div>
        ) : (
          docs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              style={{ padding: '9px 14px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', flexShrink: 0 }}>PDF</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {doc.filename}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
                  {doc.chunk_count} chunks · {new Date(doc.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(doc, e)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-serif)' }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
