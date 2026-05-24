import express from 'express'
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const genreUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
})
const analysisUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT || 3001)
const hfModel = process.env.HF_MODEL || 'gastonduault/music-classifier'
const hfTimeoutMs = 35_000
const beatlyzeBaseUrl = 'https://api.beatlyze.dev/v1'
const beatlyzePollTimeoutMs = 90_000

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

app.post('/api/analyze', analysisUpload.single('audio'), async (request, response) => {
  const token = process.env.BEATLYZE_API_KEY
  if (!token) {
    response.status(503).json({ error: 'Beatlyze API is not configured. Set BEATLYZE_API_KEY.' })
    return
  }

  if (!request.file) {
    response.status(400).json({ error: 'Audio file is required.' })
    return
  }

  try {
    const formData = new FormData()
    formData.append('file', new Blob([request.file.buffer], { type: request.file.mimetype || 'application/octet-stream' }), request.file.originalname || 'track.wav')

    const submitResponse = await fetch(`${beatlyzeBaseUrl}/analyze/upload`, {
      method: 'POST',
      headers: {
        'X-API-Key': token,
        'Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      body: formData,
    })

    if (!submitResponse.ok) {
      response.status(submitResponse.status).json({ error: await submitResponse.text() })
      return
    }

    const submitted = await submitResponse.json()
    const jobId = submitted.job_id
    if (!jobId) {
      response.status(502).json({ error: 'Beatlyze did not return a job_id.' })
      return
    }

    const analysis = await pollBeatlyzeAnalysis(token, jobId)
    response.json(normalizeBeatlyzeResult(analysis))
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Beatlyze analysis failed.' })
  }
})

app.post('/api/genre', genreUpload.single('audio'), async (request, response) => {
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

async function pollBeatlyzeAnalysis(token, jobId) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < beatlyzePollTimeoutMs) {
    const resultResponse = await fetch(`${beatlyzeBaseUrl}/analysis/${jobId}`, {
      headers: {
        'X-API-Key': token,
      },
    })

    if (!resultResponse.ok) {
      throw new Error(await resultResponse.text())
    }

    const payload = await resultResponse.json()
    if (payload.status === 'completed') return payload.result
    if (payload.status === 'failed') {
      throw new Error(payload.error || 'Beatlyze analysis failed.')
    }

    await new Promise((resolve) => setTimeout(resolve, 2500))
  }

  throw new Error('Beatlyze analysis timed out.')
}

function normalizeBeatlyzeResult(result) {
  const genres = Array.isArray(result.genre_suggestions) ? result.genre_suggestions : []
  const moods = Array.isArray(result.mood_tags) ? result.mood_tags : []
  const genre = normalizeGenre(genres[0] || 'Unknown')
  const scale = result.scale ? titleCase(String(result.scale)) : ''

  return {
    provider: 'Beatlyze',
    genre,
    confidence: Math.round((result.genre_confidence ?? 0.7) * 100),
    tempo: Math.round(result.bpm ?? 0),
    tempoConfidence: Math.round((result.bpm_confidence ?? 0) * 100),
    key: result.key_notation || [result.key, scale].filter(Boolean).join(' ') || 'Unknown',
    keyConfidence: Math.round((result.key_confidence ?? 0) * 100),
    energy: Math.round((result.energy ?? 0) * 100),
    danceability: Math.round((result.danceability ?? 0) * 100),
    mood: moods[0] || 'balanced',
    genreLabels: genres.map((item) => titleCase(String(item))),
    moodLabels: moods.map((item) => titleCase(String(item))),
    loudness: result.loudness_lufs ?? null,
    duration: result.duration_seconds ?? null,
  }
}

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
