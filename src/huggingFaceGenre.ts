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

const defaultModel = 'gastonduault/music-classifier'
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

export async function classifyGenreWithHuggingFace(file: File, token: string, model = defaultModel) {
  const cleanToken = token.trim()
  const cleanModel = model.trim() || defaultModel

  if (!cleanToken) return null

  const response = await fetch(`https://api-inference.huggingface.co/models/${cleanModel}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: await file.arrayBuffer(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Hugging Face genre request failed (${response.status}): ${message}`)
  }

  const payload = (await response.json()) as HuggingFaceLabel[] | { error?: string }
  if (!Array.isArray(payload)) {
    throw new Error(payload.error || 'Hugging Face returned an unexpected genre response.')
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

export function getDefaultHuggingFaceModel() {
  return defaultModel
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
