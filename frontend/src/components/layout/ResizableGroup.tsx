import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'

const MIN_FRAC = 0.1

interface Props {
  direction: 'horizontal' | 'vertical'
  /** stable key describing the children set; sizes reset when it changes */
  signature: string
  children: ReactNode[]
}

export function ResizableGroup({ direction, signature, children }: Props) {
  const horizontal = direction === 'horizontal'
  const containerRef = useRef<HTMLDivElement>(null)
  const [sizes, setSizes] = useState<number[]>(() => children.map(() => 1))
  const drag = useRef<{ index: number; start: number; startSizes: number[] } | null>(null)

  useEffect(() => {
    setSizes(children.map(() => 1))
  }, [signature])

  function onPointerDown(e: React.PointerEvent, index: number) {
    e.preventDefault()
    drag.current = { index, start: horizontal ? e.clientX : e.clientY, startSizes: [...sizes] }
    document.body.style.cursor = horizontal ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const extent = horizontal ? rect.width : rect.height
    if (extent <= 0) return

    const total = d.startSizes.reduce((a, b) => a + b, 0)
    const pos = horizontal ? e.clientX : e.clientY
    const deltaFrac = ((pos - d.start) / extent) * total

    const i = d.index
    let a = d.startSizes[i] + deltaFrac
    let b = d.startSizes[i + 1] - deltaFrac
    const min = MIN_FRAC * total
    if (a < min) { b -= min - a; a = min }
    if (b < min) { a -= min - b; b = min }

    const next = [...d.startSizes]
    next[i] = a
    next[i + 1] = b
    setSizes(next)
  }

  function endDrag(e: React.PointerEvent) {
    if (!drag.current) return
    drag.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      style={{
        display: 'flex',
        flexDirection: horizontal ? 'row' : 'column',
        height: '100%',
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {children.map((child, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <div
              onPointerDown={(e) => onPointerDown(e, i - 1)}
              style={{
                flexShrink: 0,
                background: 'var(--border)',
                cursor: horizontal ? 'col-resize' : 'row-resize',
                width: horizontal ? '6px' : '100%',
                height: horizontal ? '100%' : '6px',
                transition: 'background 0.12s',
                zIndex: 5,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--accent)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--border)')}
            />
          )}
          <div style={{ flex: `${sizes[i] ?? 1} 1 0`, minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {child}
          </div>
        </Fragment>
      ))}
    </div>
  )
}
