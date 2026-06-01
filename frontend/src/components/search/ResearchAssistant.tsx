import { useState } from 'react'
import { researchAssistant } from '../../api/search'
import { SaveToNoteMenu } from '../notes/SaveToNoteMenu'
import type { ResearchPlan } from '../../types'

interface Props {
  onRunSearch: (query: string) => void
}

export function ResearchAssistant({ onRunSearch }: Props) {
  const [project, setProject] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<ResearchPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handlePlan() {
    if (!project.trim()) return
    setLoading(true)
    setPlan(null)
    setError(null)
    try {
      setPlan(await researchAssistant(project))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not generate a plan.')
    } finally {
      setLoading(false)
    }
  }

  function planMarkdown(p: ResearchPlan): string {
    return (
      `# Research Plan\n\n${p.summary}\n\n` +
      (p.questions.length ? `## Research Questions\n${p.questions.map((q) => `- ${q}`).join('\n')}\n\n` : '') +
      (p.subtopics.length ? `## Key Subtopics\n${p.subtopics.map((s) => `- ${s}`).join('\n')}\n\n` : '') +
      (p.searches.length ? `## Searches to Run\n${p.searches.map((s) => `- ${s}`).join('\n')}\n\n` : '') +
      (p.outline.length ? `## Outline\n${p.outline.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n` : '')
    )
  }

  const Section = ({ title, items }: { title: string; items: string[] }) =>
    items.length === 0 ? null : (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-ui)', marginBottom: '6px' }}>
          {title}
        </div>
        {items.map((it, i) => (
          <div key={i} style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', lineHeight: 1.6, padding: '2px 0' }}>
            — {it}
          </div>
        ))}
      </div>
    )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginBottom: '8px', lineHeight: 1.5 }}>
        Describe your ISEF project and I'll help you start — research questions, searches to run, subtopics, and an outline.
      </div>
      <textarea
        value={project}
        onChange={(e) => setProject(e.target.value)}
        placeholder="e.g. I want to test whether different LED light colors change how fast basil grows…"
        rows={4}
        style={{
          width: '100%', padding: '10px 12px', background: 'var(--bg-base)',
          border: '1px solid var(--border)', borderRadius: '4px',
          color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-ui)',
          outline: 'none', resize: 'vertical', lineHeight: 1.5,
        }}
      />
      <button
        onClick={handlePlan}
        disabled={loading || !project.trim()}
        style={{
          marginTop: '8px', padding: '8px 18px',
          background: loading || !project.trim() ? 'var(--bg-surface)' : 'var(--accent)',
          border: 'none', borderRadius: '2px', color: '#fff',
          fontSize: '14px', fontFamily: 'var(--font-ui)', fontWeight: 600,
          cursor: loading || !project.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Thinking…' : 'Help me start →'}
      </button>

      {error && (
        <div style={{ marginTop: '14px', border: '1px solid var(--red)', borderRadius: '6px', padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'var(--font-ui)', background: 'rgba(224,97,111,0.06)' }}>
          {error}
        </div>
      )}

      {plan && (
        <div style={{ marginTop: '20px' }}>
          {plan.summary && (
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', lineHeight: 1.6, marginBottom: '16px', borderLeft: '2px solid var(--accent)', paddingLeft: '12px' }}>
              {plan.summary}
            </div>
          )}

          <Section title="Research Questions" items={plan.questions} />

          {/* searches are clickable */}
          {plan.searches.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-ui)', marginBottom: '6px' }}>
                Searches to Run <span style={{ textTransform: 'none', letterSpacing: 0 }}>(click to search)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {plan.searches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onRunSearch(s)}
                    style={{
                      textAlign: 'left', background: 'var(--bg-surface)',
                      border: '1px solid var(--border)', borderRadius: '4px',
                      padding: '7px 10px', color: 'var(--accent-light)',
                      fontSize: '13px', fontFamily: 'var(--font-ui)', cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)')}
                  >
                    🔍 {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Section title="Key Subtopics" items={plan.subtopics} />
          <Section title="Outline" items={plan.outline} />

          <div style={{ marginTop: '6px', padding: '7px 12px', display: 'inline-block', border: '1px solid var(--border)', borderRadius: '4px' }}>
            <SaveToNoteMenu title="Research Plan" tags={['plan']} label="Save plan to note" getMarkdown={() => planMarkdown(plan)} />
          </div>
        </div>
      )}
    </div>
  )
}
