export type HuggingFaceGenreResult = {
  genre: string
  confidence: number
  mood: string
  labels: string[]
}

type HuggingFaceLabel = {
  label: string
  score: number
}

const genreAliases: Record<string, string> = {
  blues: 'Blues',
  classical: 'Classical',
  country: 'Country',
  disco: 'Disco',
  hiphop: 'Hip-Hop / Rap',
  'hip-hop': 'Hip-Hop / Rap',
  jazz: 'Jazz',
  metal: 'Metal',
  pop: 'Pop',
  reggae: 'Reggae',
  rock: 'Rock',
}

const vibeByGenre: Record<string, string> = {
  Blues: 'soulful',
  Classical: 'cinematic',
  Country: 'organic',
  Disco: 'bright',
  'Hip-Hop / Rap': 'rhythmic',
  Jazz: 'smooth',
  Metal: 'high-energy',
  Pop: 'bright',
  Reggae: 'laid-back',
  Rock: 'driving',
}

export async function classifyGenreWithHuggingFace(file: File) {
  const formData = new FormData()
  formData.append('audio', file)

  const response = await fetch('/api/genre', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error || `Genre request failed (${response.status}).`)
  }

  const payload = (await response.json()) as HuggingFaceGenreResult | HuggingFaceLabel[] | { error?: string }
  if (!Array.isArray(payload)) {
    if ('genre' in payload) return payload
    throw new Error(payload.error || 'Genre API returned an unexpected response.')
  }

  const sortedLabels = payload
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const winner = sortedLabels[0]
  if (!winner) return null

  const genre = normalizeGenre(winner.label)

  return {
    genre,
    confidence: Math.max(54, Math.min(96, Math.round(winner.score * 100))),
    mood: vibeByGenre[genre] ?? 'balanced',
    labels: sortedLabels.map((item) => `${normalizeGenre(item.label)} ${(item.score * 100).toFixed(0)}%`),
  } satisfies HuggingFaceGenreResult
}

function normalizeGenre(label: string) {
  const cleanLabel = label.toLowerCase().replace(/^label_\d+[:\s-]*/i, '').trim()
  return genreAliases[cleanLabel] ?? titleCase(cleanLabel.replace(/_/g, ' '))
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
