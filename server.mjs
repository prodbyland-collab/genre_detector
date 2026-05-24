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
        ...beatlyzeAuthHeaders(token),
        'Idempotency-Key': `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      body: formData,
    })

    if (!submitResponse.ok) {
      response.status(submitResponse.status).json({ error: await submitResponse.text() })
      return
    }

    const submitted = await submitResponse.json()
    const immediateResult = extractBeatlyzeResult(submitted)
    if (immediateResult) {
      response.json(normalizeBeatlyzeResult(immediateResult))
      return
    }

    const jobId = submitted.job_id || submitted.jobId || submitted.id || submitted.analysis_id || submitted.analysisId
    if (!jobId) {
      response.status(502).json({
        error: 'Beatlyze did not return a job id.',
        providerResponse: redactProviderPayload(submitted),
      })
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
      headers: beatlyzeAuthHeaders(token),
    })

    if (!resultResponse.ok) {
      throw new Error(await resultResponse.text())
    }

    const payload = await resultResponse.json()
    const status = String(payload.status || payload.state || '').toLowerCase()
    const result = extractBeatlyzeResult(payload)

    if (result || ['completed', 'complete', 'done', 'succeeded', 'success'].includes(status)) {
      return result || payload
    }

    if (['failed', 'error', 'cancelled', 'canceled'].includes(status)) {
      throw new Error(payload.error || payload.message || 'Beatlyze analysis failed.')
    }

    await new Promise((resolve) => setTimeout(resolve, 2500))
  }

  throw new Error('Beatlyze analysis timed out.')
}

function normalizeBeatlyzeResult(result) {
  const rawGenres = firstArray(result.genre_suggestions, result.genreSuggestions, result.genres, result.genre_hints, result.genreHints)
  const rawMoods = firstArray(result.mood_tags, result.moodTags, result.moods, result.mood_hints, result.moodHints)
  const genres = rawGenres.map(labelFromMaybeScoredValue)
  const moods = rawMoods.map(labelFromMaybeScoredValue)
  const genre = normalizeGenre(labelFromMaybeScoredValue(result.genre) || genres[0] || 'Unknown')
  const scale = result.scale || result.mode ? titleCase(String(result.scale || result.mode)) : ''
  const bpm = numberFrom(result.bpm, result.tempo, result.beats_per_minute, result.beatsPerMinute)
  const keyConfidence = confidenceFrom(result.key_confidence, result.keyConfidence)
  const bpmConfidence = confidenceFrom(result.bpm_confidence, result.bpmConfidence, result.tempo_confidence, result.tempoConfidence)
  const genreConfidence = confidenceFrom(result.genre_confidence, result.genreConfidence, result.confidence)

  return {
    provider: 'Beatlyze',
    genre,
    confidence: genreConfidence || 70,
    tempo: Math.round(bpm || 0),
    tempoConfidence: bpmConfidence || 0,
    key: result.key_notation || result.keyNotation || [result.key, scale].filter(Boolean).join(' ') || 'Unknown',
    keyConfidence,
    energy: confidenceFrom(result.energy) || 0,
    danceability: confidenceFrom(result.danceability) || 0,
    mood: labelFromMaybeScoredValue(result.mood) || moods[0] || 'balanced',
    genreLabels: genres.map((item) => titleCase(String(item))),
    moodLabels: moods.map((item) => titleCase(String(item))),
    loudness: numberFrom(result.loudness_lufs, result.loudnessLufs, result.lufs, result.loudness) ?? null,
    duration: numberFrom(result.duration_seconds, result.durationSeconds, result.duration) ?? null,
  }
}

function beatlyzeAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'X-API-Key': token,
  }
}

function extractBeatlyzeResult(payload) {
  if (!payload || typeof payload !== 'object') return null
  return payload.result || payload.analysis || payload.data?.result || payload.data?.analysis || payload.data || null
}

function redactProviderPayload(payload) {
  return JSON.parse(
    JSON.stringify(payload, (key, value) => {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('key')) return '[redacted]'
      return value
    }),
  )
}

function firstArray(...values) {
  return values.find((value) => Array.isArray(value)) || []
}

function labelFromMaybeScoredValue(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return value.label || value.name || value.genre || value.mood || ''
  return String(value)
}

function numberFrom(...values) {
  for (const value of values) {
    const numericValue = Number(value)
    if (Number.isFinite(numericValue)) return numericValue
  }
  return null
}

function confidenceFrom(...values) {
  const value = numberFrom(...values)
  if (value === null) return 0
  return Math.round(value <= 1 ? value * 100 : value)
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
