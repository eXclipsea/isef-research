import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import type { Range } from '@codemirror/state'

// styling decorations
const D = {
  strong: Decoration.mark({ class: 'cm-md-strong' }),
  em: Decoration.mark({ class: 'cm-md-em' }),
  strike: Decoration.mark({ class: 'cm-md-strike' }),
  code: Decoration.mark({ class: 'cm-md-code' }),
  quote: Decoration.mark({ class: 'cm-md-quote' }),
  link: Decoration.mark({ class: 'cm-md-link' }),
  hidden: Decoration.replace({}),
}
const headingLine = (lvl: number) => Decoration.line({ class: `cm-md-h${lvl}` })

function cursorTouches(view: EditorView, from: number, to: number): boolean {
  for (const r of view.state.selection.ranges) {
    if (r.from <= to && r.to >= from) return true
  }
  return false
}

function buildDecorations(view: EditorView): DecorationSet {
  const marks: Range<Decoration>[] = []
  const tree = syntaxTree(view.state)
  const doc = view.state.doc

  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter: (node) => {
        const name = node.name

        // headings: style the whole line + hide the "### " marker
        const h = /^ATXHeading(\d)$/.exec(name)
        if (h) {
          const line = doc.lineAt(node.from)
          marks.push(headingLine(+h[1]).range(line.from))
          return
        }

        if (name === 'StrongEmphasis') marks.push(D.strong.range(node.from, node.to))
        else if (name === 'Emphasis') marks.push(D.em.range(node.from, node.to))
        else if (name === 'Strikethrough') marks.push(D.strike.range(node.from, node.to))
        else if (name === 'InlineCode') marks.push(D.code.range(node.from, node.to))
        else if (name === 'Blockquote') marks.push(D.quote.range(node.from, node.to))

        // hide syntax markers when the cursor isn't editing that span
        if (
          name === 'EmphasisMark' ||
          name === 'CodeMark' ||
          name === 'StrikethroughMark'
        ) {
          const parent = node.node.parent
          if (parent && !cursorTouches(view, parent.from, parent.to)) {
            marks.push(D.hidden.range(node.from, node.to))
          }
        }

        if (name === 'HeaderMark') {
          const parent = node.node.parent
          if (parent && !cursorTouches(view, parent.from, parent.to)) {
            // also swallow the single space after "###"
            let end = node.to
            if (doc.sliceString(end, end + 1) === ' ') end += 1
            marks.push(D.hidden.range(node.from, end))
          }
        }
      },
    })
  }

  // CodeMirror requires decorations sorted by position
  marks.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide)
  return Decoration.set(marks)
}

export const livePreview = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view)
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.selectionSet || u.viewportChanged) {
        this.decorations = buildDecorations(u.view)
      }
    }
  },
  { decorations: (v) => v.decorations }
)
