// Parse a fetch Response as JSON, or throw a human-readable error.
export async function jsonOrThrow<T>(r: Response): Promise<T> {
  if (!r.ok) {
    let msg = `Request failed (${r.status})`
    try {
      const data = await r.json()
      msg = (data && (data.detail || data.message)) || msg
    } catch {
      try {
        const t = await r.text()
        if (t) msg = t
      } catch {
        /* ignore */
      }
    }
    throw new Error(msg)
  }
  return r.json() as Promise<T>
}
