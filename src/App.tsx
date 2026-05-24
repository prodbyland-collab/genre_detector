import { type ChangeEvent, type DragEvent, useMemo, useRef, useState } from 'react'
import {
  AudioLines,
  BadgeCheck,
  CircleGauge,
  Disc3,
  FileAudio,
  KeyRound,
  LoaderCircle,
  Music2,
  Sparkles,
  Upload,
  UserRoundSearch,
  WandSparkles,
} from 'lucide-react'
import './App.css'
import { type AnalysisProgress, type AnalysisResult, analyzeAudioFile } from './audioAnalysis'

const supportedFormats = 'MP3, WAV, M4A, AAC, OGG'

function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [progress, setProgress] = useState<AnalysisProgress | null>(null)

  const fileMeta = useMemo(() => {
    if (!file) return null
    return `${(file.size / 1024 / 1024).toFixed(1)} MB`
  }, [file])

  function handleFile(nextFile?: File) {
    if (!nextFile) return
    if (!nextFile.type.startsWith('audio/')) {
      setError('Please upload an audio file.')
      return
    }

    setFile(nextFile)
    setResult(null)
    setError('')
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(URL.createObjectURL(nextFile))
  }

  async function runAnalysis() {
    if (!file) {
      setError('Choose an audio file first.')
      return
    }

    setIsAnalyzing(true)
    setProgress({ percent: 2, stage: 'Starting analysis', detail: 'Warming up the audio engine' })
    setError('')
    try {
      const nextResult = await analyzeAudioFile(file, {
        useHuggingFace: true,
        onProgress: setProgress,
      })
      setProgress({ percent: 100, stage: 'Analysis complete', detail: 'Rendering results' })
      setResult(nextResult)
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Could not analyze that audio file.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0])
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="intro-panel">
          <div className="brand-row">
            <div className="brand-mark">
              <Disc3 aria-hidden="true" />
            </div>
            <span>Genre Detector</span>
          </div>

          <div className="intro-copy">
            <h1>Find the lane for any beat.</h1>
            <p>
              Upload a track and get instant estimates for genre, tempo, key, energy, and artists who could sit naturally on the vibe.
            </p>
          </div>

          <div className="signal-strip" aria-hidden="true">
            {Array.from({ length: 48 }).map((_, index) => (
              <span key={index} style={{ height: `${24 + ((index * 19) % 62)}%` }} />
            ))}
          </div>

          <div
            className={`upload-zone ${isDragging ? 'is-dragging' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
            }}
          >
            <input ref={inputRef} type="file" accept="audio/*" onChange={onInputChange} />
            <div className="upload-icon">
              <Upload aria-hidden="true" />
            </div>
            <div>
              <strong>{file ? file.name : 'Drop audio here or browse'}</strong>
              <span>{file ? fileMeta : supportedFormats}</span>
            </div>
          </div>

          {audioUrl && (
            <div className="player-row">
              <FileAudio aria-hidden="true" />
              <audio controls src={audioUrl} />
            </div>
          )}

          <div className="action-row">
            <button className="primary-action" onClick={runAnalysis} disabled={isAnalyzing || !file}>
              {isAnalyzing ? <LoaderCircle className="spin" aria-hidden="true" /> : <WandSparkles aria-hidden="true" />}
              <span>{isAnalyzing ? 'Analyzing' : 'Analyze Track'}</span>
            </button>
            {error && <p className="error-text">{error}</p>}
          </div>

          {isAnalyzing && progress && <ProgressBar progress={progress} />}
        </div>

        <div className="results-panel">
          {result ? <Results result={result} /> : <EmptyState isAnalyzing={isAnalyzing} progress={progress} />}
        </div>
      </section>
    </main>
  )
}

function EmptyState({ isAnalyzing, progress }: { isAnalyzing: boolean; progress: AnalysisProgress | null }) {
  return (
    <div className="empty-state">
      <div className="empty-visual">
        <AudioLines aria-hidden="true" />
      </div>
      <h2>{isAnalyzing ? (progress?.stage ?? 'Listening closely...') : 'Your analysis will appear here.'}</h2>
      <p>{isAnalyzing ? (progress?.detail ?? 'Processing the track') : 'Tempo, key, genre, mood, and artist-fit suggestions update after the track is decoded.'}</p>
      {isAnalyzing && progress && <ProgressBar progress={progress} compact />}
    </div>
  )
}

function ProgressBar({ progress, compact = false }: { progress: AnalysisProgress; compact?: boolean }) {
  return (
    <div className={`progress-card ${compact ? 'is-compact' : ''}`} role="status" aria-live="polite">
      <div className="progress-meta">
        <span>{progress.stage}</span>
        <strong>{Math.round(progress.percent)}%</strong>
      </div>
      <div className="progress-track" aria-label={`Analysis progress ${Math.round(progress.percent)}%`}>
        <span style={{ width: `${progress.percent}%` }} />
      </div>
      {!compact && <p>{progress.detail}</p>}
    </div>
  )
}

function Results({ result }: { result: AnalysisResult }) {
  return (
    <div className="results-stack">
      <div className="result-hero">
        <div>
          <span className="eyebrow">
            <BadgeCheck aria-hidden="true" />
            {result.confidence}% genre confidence - {result.genreEngine}
          </span>
          <h2>{result.genre}</h2>
          <p>{result.mood} feel with {result.bassWeight}% low-end weight and {result.brightness}% brightness.</p>
        </div>
        <div className="genre-disc" aria-hidden="true">
          <Music2 />
        </div>
      </div>

      <Waveform values={result.waveform} />

      <div className="metrics-grid">
        <Metric icon={<CircleGauge />} label="Tempo estimate" value={`${result.tempo} BPM`} subvalue={`${result.tempoConfidence}% confidence`} />
        <Metric icon={<KeyRound />} label="Key estimate" value={result.key} subvalue={`${result.keyConfidence}% confidence`} />
        <Metric icon={<Sparkles />} label="Energy" value={`${result.energy}%`} />
        <Metric icon={<AudioLines />} label="Dance" value={`${result.danceability}%`} />
      </div>

      <p className="accuracy-note">
        Tempo and key are local estimates. For release-grade accuracy, connect a dedicated music analysis provider or server-side MIR model.
      </p>

      {result.genreLabels.length > 0 && (
        <div className="label-row">
          {result.genreLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      )}

      <section className="artist-section">
        <div className="section-title">
          <UserRoundSearch aria-hidden="true" />
          <h3>Artist direction</h3>
        </div>
        {result.artists.length > 0 ? (
          <div className="artist-list">
            {result.artists.map((artist) => (
              <article className="artist-card" key={artist.name}>
                <div>
                  <strong>{artist.name}</strong>
                  <span>{artist.lane}</span>
                </div>
                <div className="fit-meter" aria-label={`${artist.fit}% directional match`}>
                  <span style={{ width: `${artist.fit}%` }} />
                </div>
                <p>{artist.reason}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="accuracy-note">Artist direction is hidden because genre confidence is too low for a useful match.</p>
        )}
      </section>
    </div>
  )
}

function Waveform({ values }: { values: number[] }) {
  return (
    <div className="waveform" aria-label="Audio waveform">
      {values.map((value, index) => (
        <span key={index} style={{ height: `${Math.max(8, value * 100)}%` }} />
      ))}
    </div>
  )
}

function Metric({ icon, label, value, subvalue }: { icon: React.ReactNode; label: string; value: string; subvalue?: string }) {
  return (
    <div className="metric">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      {subvalue && <em>{subvalue}</em>}
    </div>
  )
}

export default App
