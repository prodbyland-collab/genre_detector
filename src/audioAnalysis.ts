export type ArtistMatch = {
  name: string
  fit: number
  reason: string
  lane: string
}

export type AnalysisResult = {
  genre: string
  confidence: number
  tempo: number
  key: string
  energy: number
  danceability: number
  mood: string
  brightness: number
  bassWeight: number
  engine: string
  genreEngine: string
  genreLabels: string[]
  waveform: number[]
  artists: ArtistMatch[]
}

type AudioFeatures = {
  tempo: number
  key: string
  energy: number
  danceability: number
  brightness: number
  bassWeight: number
  dynamicRange: number
  engine: string
  waveform: number[]
}

export type AnalyzeOptions = {
  huggingFaceToken?: string
  huggingFaceModel?: string
}

type AudioContextConstructor = typeof AudioContext

declare global {
  interface Window {
    webkitAudioContext?: AudioContextConstructor
  }
}

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const artistProfiles = [
  { name: 'Drake', lane: 'melodic rap', tempo: 82, energy: 46, brightness: 42, bass: 64 },
  { name: 'Travis Scott', lane: 'dark trap', tempo: 140, energy: 72, brightness: 38, bass: 78 },
  { name: 'SZA', lane: 'alt R&B', tempo: 92, energy: 38, brightness: 48, bass: 45 },
  { name: 'The Weeknd', lane: 'cinematic pop/R&B', tempo: 116, energy: 66, brightness: 67, bass: 52 },
  { name: 'Future', lane: 'street trap', tempo: 146, energy: 70, brightness: 41, bass: 82 },
  { name: 'Billie Eilish', lane: 'minimal dark pop', tempo: 78, energy: 30, brightness: 31, bass: 58 },
  { name: 'Bad Bunny', lane: 'reggaeton', tempo: 96, energy: 72, brightness: 60, bass: 70 },
  { name: 'Dua Lipa', lane: 'dance pop', tempo: 124, energy: 78, brightness: 74, bass: 55 },
  { name: 'Kendrick Lamar', lane: 'left-field hip hop', tempo: 94, energy: 68, brightness: 58, bass: 60 },
  { name: 'Rema', lane: 'afrobeats', tempo: 104, energy: 64, brightness: 66, bass: 54 },
  { name: 'Metro Boomin', lane: 'producer tag trap', tempo: 148, energy: 76, brightness: 36, bass: 86 },
  { name: 'Tyla', lane: 'amapiano pop', tempo: 112, energy: 58, brightness: 62, bass: 68 },
]

export async function analyzeAudioFile(file: File, options: AnalyzeOptions = {}): Promise<AnalysisResult> {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) {
    throw new Error('This browser does not support Web Audio analysis.')
  }
  const audioContext = new AudioContextClass()
  try {
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const mono = mixToMono(audioBuffer)
    const features = await extractFeatures(mono, audioBuffer.sampleRate)
    const genreResult = await classifyGenre(file, features, options)
    return {
      ...features,
      ...genreResult,
      artists: matchArtists(features),
    }
  } finally {
    await audioContext.close()
  }
}

async function classifyGenre(file: File, features: AudioFeatures, options: AnalyzeOptions) {
  if (options.huggingFaceToken?.trim()) {
    try {
      const { classifyGenreWithHuggingFace } = await import('./huggingFaceGenre')
      const hfResult = await classifyGenreWithHuggingFace(file, options.huggingFaceToken, options.huggingFaceModel)
      if (hfResult) {
        return {
          genre: hfResult.genre,
          confidence: hfResult.confidence,
          mood: hfResult.mood,
          genreEngine: 'Hugging Face API',
          genreLabels: hfResult.labels,
        }
      }
    } catch (error) {
      console.warn('Hugging Face genre classification failed, using local genre fallback.', error)
    }
  }

  return {
    ...classifyTrack(features),
    genreEngine: 'Local vibe model',
    genreLabels: [],
  }
}

function mixToMono(buffer: AudioBuffer) {
  const length = buffer.length
  const channels = buffer.numberOfChannels
  const mono = new Float32Array(length)

  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i += 1) {
      mono[i] += data[i] / channels
    }
  }

  return mono
}

async function extractFeatures(samples: Float32Array, sampleRate: number): Promise<AudioFeatures> {
  const targetRate = 11_025
  const downsampled = downsample(samples, sampleRate, targetRate)
  const frameSize = 1024
  const hop = 512
  const energies: number[] = []
  const centroids: number[] = []
  const bassRatios: number[] = []

  for (let start = 0; start + frameSize < downsampled.length; start += hop) {
    let energy = 0
    let zeroCrossings = 0
    let bass = 0

    for (let i = 0; i < frameSize; i += 1) {
      const current = downsampled[start + i]
      const previous = i > 0 ? downsampled[start + i - 1] : current
      energy += current * current
      if ((current >= 0 && previous < 0) || (current < 0 && previous >= 0)) {
        zeroCrossings += 1
      }
      if (i > 1) {
        const lowMovement = Math.abs(current - downsampled[start + i - 2])
        bass += Math.max(0, Math.abs(current) - lowMovement)
      }
    }

    energies.push(Math.sqrt(energy / frameSize))
    centroids.push((zeroCrossings / frameSize) * targetRate * 0.5)
    bassRatios.push(clamp((bass / frameSize) * 16, 0, 1))
  }

  const rms = average(energies)
  const energy = clamp(Math.round(rms * 240), 0, 100)
  const brightness = clamp(Math.round(normalize(average(centroids), 300, 4200) * 100), 0, 100)
  const bassWeight = clamp(Math.round(average(bassRatios) * 100), 0, 100)
  const fallbackTempo = estimateTempo(energies, targetRate / hop)
  const dynamicRange = clamp(Math.round((percentile(energies, 0.9) - percentile(energies, 0.2)) * 220), 0, 100)
  const essentiaAnalysis = await analyzeWithEssentia(samples, sampleRate)
  const tempo = essentiaAnalysis.tempo || fallbackTempo
  const danceability = clamp(Math.round(100 - Math.abs(tempo - 118) * 0.8 + bassWeight * 0.18 - dynamicRange * 0.1), 0, 100)

  return {
    tempo,
    key: essentiaAnalysis.key || estimateKey(downsampled, targetRate),
    energy,
    danceability,
    brightness,
    bassWeight,
    dynamicRange,
    engine: essentiaAnalysis.engine,
    waveform: buildWaveform(samples, 96),
  }
}

async function analyzeWithEssentia(samples: Float32Array, sampleRate: number) {
  try {
    const { getEssentia } = await import('./essentiaClient')
    const essentia = await getEssentia()
    const vector = essentia.arrayToVector(samples) as { delete?: () => void }
    try {
      const rhythm = essentia.RhythmExtractor2013(vector, 208, 'multifeature', 40)
      const key = essentia.KeyExtractor(
        vector,
        true,
        4096,
        4096,
        12,
        3500,
        60,
        25,
        0.2,
        'edma',
        sampleRate,
        0.0001,
        440,
        'cosine',
        'hann',
      )
      const keyName = key.key && key.scale ? `${key.key} ${key.scale}` : ''
      return {
        tempo: normalizeTempo(Math.round(rhythm.bpm ?? 0)),
        key: keyName,
        engine: 'Essentia.js',
      }
    } finally {
      vector.delete?.()
    }
  } catch (error) {
    console.warn('Essentia.js analysis failed, using fallback analysis.', error)
    return {
      tempo: 0,
      key: '',
      engine: 'Fallback DSP',
    }
  }
}

function estimateTempo(energies: number[], framesPerSecond: number) {
  if (energies.length < 8) return 0

  const flux = energies.map((energy, index) => Math.max(0, energy - (energies[index - 1] ?? energy)))
  const meanFlux = average(flux)
  const centered = flux.map((value) => Math.max(0, value - meanFlux * 0.7))
  let bestBpm = 90
  let bestScore = -Infinity

  for (let bpm = 65; bpm <= 185; bpm += 1) {
    const lag = Math.round((60 / bpm) * framesPerSecond)
    let score = 0
    for (let i = lag; i < centered.length; i += 1) {
      score += centered[i] * centered[i - lag]
    }
    if (score > bestScore) {
      bestScore = score
      bestBpm = bpm
    }
  }

  if (bestBpm < 85) return bestBpm * 2
  if (bestBpm > 165) return Math.round(bestBpm / 2)
  return bestBpm
}

function normalizeTempo(bpm: number) {
  if (!Number.isFinite(bpm) || bpm <= 0) return 0
  if (bpm < 85) return bpm * 2
  if (bpm > 170) return Math.round(bpm / 2)
  return bpm
}

function estimateKey(samples: Float32Array, sampleRate: number) {
  const chroma = new Array<number>(12).fill(0)
  const windowSize = 4096
  const maxWindows = 28
  const step = Math.max(windowSize, Math.floor((samples.length - windowSize) / maxWindows))

  for (let start = 0; start + windowSize < samples.length; start += step) {
    for (let note = 0; note < 12; note += 1) {
      for (let octave = 2; octave <= 5; octave += 1) {
        const midi = 12 * octave + note
        const frequency = 440 * 2 ** ((midi - 69) / 12)
        chroma[note] += goertzelPower(samples, start, windowSize, sampleRate, frequency)
      }
    }
  }

  const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
  const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
  let best = { score: -Infinity, note: 0, mode: 'major' }

  for (let root = 0; root < 12; root += 1) {
    const majorScore = profileScore(chroma, majorProfile, root)
    const minorScore = profileScore(chroma, minorProfile, root)
    if (majorScore > best.score) best = { score: majorScore, note: root, mode: 'major' }
    if (minorScore > best.score) best = { score: minorScore, note: root, mode: 'minor' }
  }

  return `${noteNames[best.note]} ${best.mode}`
}

function classifyTrack(features: AudioFeatures) {
  const { tempo, energy, brightness, bassWeight, danceability } = features

  const candidates = [
    { genre: 'Trap', score: score(tempo, 140, 24) + score(bassWeight, 78, 30) + score(brightness, 38, 35) },
    { genre: 'Hip-Hop / Rap', score: score(tempo, 92, 26) + score(bassWeight, 63, 30) + score(energy, 58, 36) },
    { genre: 'R&B', score: score(tempo, 84, 24) + score(energy, 35, 35) + score(brightness, 46, 30) },
    { genre: 'Pop', score: score(tempo, 116, 28) + score(brightness, 70, 35) + score(energy, 68, 34) },
    { genre: 'Dance / House', score: score(tempo, 124, 12) + score(danceability, 82, 30) + score(energy, 76, 28) },
    { genre: 'Afrobeats', score: score(tempo, 104, 18) + score(danceability, 72, 28) + score(brightness, 61, 32) },
    { genre: 'Reggaeton', score: score(tempo, 96, 10) + score(bassWeight, 72, 26) + score(danceability, 76, 25) },
    { genre: 'Alt Pop', score: score(tempo, 78, 28) + score(energy, 32, 32) + score(brightness, 35, 32) },
  ].sort((a, b) => b.score - a.score)

  const best = candidates[0]
  const runnerUp = candidates[1]
  const confidence = clamp(Math.round(52 + (best.score - runnerUp.score) * 0.6), 54, 91)
  const mood = energy > 72 ? 'high-energy' : brightness > 65 ? 'bright' : bassWeight > 70 ? 'heavy' : energy < 38 ? 'moody' : 'balanced'

  return { genre: best.genre, confidence, mood }
}

function matchArtists(features: AudioFeatures): ArtistMatch[] {
  return artistProfiles
    .map((artist) => {
      const distance =
        Math.abs(features.tempo - artist.tempo) * 0.42 +
        Math.abs(features.energy - artist.energy) * 0.3 +
        Math.abs(features.brightness - artist.brightness) * 0.24 +
        Math.abs(features.bassWeight - artist.bass) * 0.26
      const fit = clamp(Math.round(100 - distance), 52, 98)
      return {
        name: artist.name,
        fit,
        lane: artist.lane,
        reason: buildArtistReason(features, artist),
      }
    })
    .sort((a, b) => b.fit - a.fit)
    .slice(0, 4)
}

function buildArtistReason(features: AudioFeatures, artist: (typeof artistProfiles)[number]) {
  const tempoNote = features.tempo >= 120 ? 'fast bounce' : features.tempo >= 95 ? 'mid-tempo pocket' : 'slow pocket'
  const toneNote = features.brightness > 62 ? 'bright top end' : features.brightness < 40 ? 'darker tone' : 'balanced tone'
  const bassNote = features.bassWeight > artist.bass ? 'extra low-end weight' : 'controlled low end'
  return `${tempoNote}, ${toneNote}, ${bassNote}`
}

function buildWaveform(samples: Float32Array, points: number) {
  const blockSize = Math.max(1, Math.floor(samples.length / points))
  const waveform: number[] = []
  for (let point = 0; point < points; point += 1) {
    let peak = 0
    const start = point * blockSize
    for (let i = 0; i < blockSize; i += 1) {
      peak = Math.max(peak, Math.abs(samples[start + i] ?? 0))
    }
    waveform.push(clamp(peak, 0.04, 1))
  }
  return waveform
}

function downsample(samples: Float32Array, originalRate: number, targetRate: number) {
  if (originalRate <= targetRate) return samples
  const ratio = originalRate / targetRate
  const length = Math.floor(samples.length / ratio)
  const result = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    result[i] = samples[Math.floor(i * ratio)]
  }
  return result
}

function goertzelPower(samples: Float32Array, start: number, size: number, sampleRate: number, frequency: number) {
  const coefficient = 2 * Math.cos((2 * Math.PI * frequency) / sampleRate)
  let q1 = 0
  let q2 = 0

  for (let i = 0; i < size; i += 1) {
    const windowValue = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1))
    const q0 = coefficient * q1 - q2 + samples[start + i] * windowValue
    q2 = q1
    q1 = q0
  }

  return q1 * q1 + q2 * q2 - coefficient * q1 * q2
}

function profileScore(chroma: number[], profile: number[], root: number) {
  return profile.reduce((total, value, index) => total + value * chroma[(index + root) % 12], 0)
}

function score(value: number, target: number, spread: number) {
  return Math.max(0, 100 - (Math.abs(value - target) / spread) * 100)
}

function normalize(value: number, min: number, max: number) {
  return (value - min) / (max - min)
}

function percentile(values: number[], percentileValue: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * percentileValue))]
}

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
