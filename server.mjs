import express from 'express'
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT || 3001)
const hfModel = process.env.HF_MODEL || 'gastonduault/music-classifier'
const hfTimeoutMs = 35_000

const genreAliases = {
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

const vibeByGenre = {
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

app.post('/api/genre', upload.single('audio'), async (request, response) => {
  const token = process.env.HF_TOKEN
  if (!token) {
    response.status(503).json({ error: 'Hugging Face genre API is not configured.' })
    return
  }

  if (!request.file) {
    response.status(400).json({ error: 'Audio file is required.' })
    return
  }

  let timeout
  try {
    const controller = new AbortController()
    timeout = setTimeout(() => controller.abort(), hfTimeoutMs)
    const hfResponse = await fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': request.file.mimetype || 'application/octet-stream',
      },
      body: request.file.buffer,
      signal: controller.signal,
    })

    if (!hfResponse.ok) {
      const message = await hfResponse.text()
      response.status(hfResponse.status).json({ error: message })
      return
    }

    const payload = await hfResponse.json()
    if (!Array.isArray(payload)) {
      response.status(502).json({ error: payload.error || 'Unexpected Hugging Face response.' })
      return
    }

    const labels = payload
      .filter((item) => Number.isFinite(item.score))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    const winner = labels[0]
    if (!winner) {
      response.status(502).json({ error: 'Hugging Face returned no genre labels.' })
      return
    }

    const genre = normalizeGenre(winner.label)
    response.json({
      genre,
      confidence: Math.max(54, Math.min(96, Math.round(winner.score * 100))),
      mood: vibeByGenre[genre] ?? 'balanced',
      labels: labels.map((item) => `${normalizeGenre(item.label)} ${(item.score * 100).toFixed(0)}%`),
    })
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === 'AbortError'
    response.status(isAbort ? 504 : 500).json({ error: isAbort ? 'Hugging Face request timed out.' : error instanceof Error ? error.message : 'Genre classification failed.' })
  } finally {
    clearTimeout(timeout)
  }
})

app.use(express.static(path.join(__dirname, 'dist')))
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(port, () => {
  console.log(`Genre Detector server listening on ${port}`)
})

function normalizeGenre(label) {
  const cleanLabel = label.toLowerCase().replace(/^label_\d+[:\s-]*/i, '').trim()
  return genreAliases[cleanLabel] ?? titleCase(cleanLabel.replace(/_/g, ' '))
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
