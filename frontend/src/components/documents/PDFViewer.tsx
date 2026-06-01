import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

interface Props { url: string }

export function PDFViewer({ url }: Props) {
  const [numPages, setNumPages] = useState<number>(0)
  const [page, setPage] = useState(1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '14px', padding: '6px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)', flexShrink: 0,
      }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: '16px', lineHeight: 1, opacity: page <= 1 ? 0.3 : 1 }}
        >
          ‹
        </button>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
          {page} / {numPages || '?'}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(numPages, p + 1))}
          disabled={page >= numPages}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: page >= numPages ? 'not-allowed' : 'pointer', fontSize: '16px', lineHeight: 1, opacity: page >= numPages ? 0.3 : 1 }}
        >
          ›
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '16px', background: 'var(--bg-surface)' }}>
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div style={{ color: 'var(--text-muted)', padding: '20px', fontSize: '13px', fontFamily: 'var(--font-ui)', fontStyle: 'italic' }}>Loading PDF…</div>}
          error={<div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '13px', fontFamily: 'var(--font-ui)' }}>Failed to load PDF</div>}
        >
          <Page pageNumber={page} width={500} renderTextLayer={true} renderAnnotationLayer={true} />
        </Document>
      </div>
    </div>
  )
}
