import { useRef, useState } from 'react'
import { uploadDocument } from '../../api/documents'
import type { Document } from '../../types'

interface Props { onUploaded: (doc: Document) => void }

export function DocumentUpload({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) { setError('Only PDF files are supported'); return }
    setLoading(true)
    setError(null)
    try {
      onUploaded(await uploadDocument(file))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `1px dashed ${dragging ? 'var(--text-secondary)' : 'var(--border)'}`,
        borderRadius: '2px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        margin: '12px',
        background: dragging ? 'var(--bg-surface)' : 'transparent',
        transition: 'all 0.1s',
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {loading ? (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          Processing PDF & building index…
        </div>
      ) : (
        <>
          <div style={{ fontSize: '22px', color: 'var(--text-muted)', lineHeight: 1 }}>↑</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-serif)' }}>
            Drop PDF here or click to upload
          </div>
          {error && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)' }}>{error}</div>}
        </>
      )}
    </div>
  )
}
