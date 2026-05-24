type EssentiaWasmModule = {
  ready?: Promise<EssentiaWasmModule>
  calledRun?: boolean
  onRuntimeInitialized?: () => void
}

type EssentiaConstructor = new (EssentiaWASM: EssentiaWasmModule, isDebug?: boolean) => EssentiaInstance

type EssentiaInstance = {
  arrayToVector(inputArray: Float32Array): { delete?: () => void }
  RhythmExtractor2013(signal: unknown, maxTempo?: number, method?: string, minTempo?: number): {
    bpm?: number
    confidence?: number
  }
  KeyExtractor(
    audio: unknown,
    averageDetuningCorrection?: boolean,
    frameSize?: number,
    hopSize?: number,
    hpcpSize?: number,
    maxFrequency?: number,
    maximumSpectralPeaks?: number,
    minFrequency?: number,
    pcpThreshold?: number,
    profileType?: string,
    sampleRate?: number,
    spectralPeaksThreshold?: number,
    tuningFrequency?: number,
    weightType?: string,
    windowType?: string,
  ): {
    key?: string
    scale?: string
    strength?: number
  }
}

declare global {
  interface Window {
    Essentia?: EssentiaConstructor
    EssentiaWASM?: EssentiaWasmModule | Promise<EssentiaWasmModule>
  }
}

let essentiaPromise: Promise<EssentiaInstance> | null = null
let scriptsPromise: Promise<void> | null = null

export async function getEssentia() {
  if (!essentiaPromise) {
    essentiaPromise = loadEssentiaScripts().then(async () => {
      const wasm = await getWasmModule()
      const Essentia = window.Essentia
      if (!Essentia) {
        throw new Error('Essentia.js core failed to load.')
      }

      return new Essentia(wasm)
    })
  }

  return essentiaPromise
}

function loadEssentiaScripts() {
  if (!scriptsPromise) {
    scriptsPromise = loadScript('/vendor/essentia/essentia-wasm.web.js').then(() =>
      loadScript('/vendor/essentia/essentia.js-core.min.js'),
    )
  }

  return scriptsPromise
}

async function getWasmModule() {
  const wasmCandidate = window.EssentiaWASM
  if (!wasmCandidate) {
    throw new Error('Essentia WASM failed to load.')
  }

  const wasm = await Promise.resolve(wasmCandidate)
  if (wasm.ready) {
    return wasm.ready
  }

  if (wasm.calledRun) return wasm

  return new Promise<EssentiaWasmModule>((resolve) => {
    const existingCallback = wasm.onRuntimeInitialized
    wasm.onRuntimeInitialized = () => {
      existingCallback?.()
      resolve(wasm)
    }
  })
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existingScript?.dataset.loaded === 'true') {
      resolve()
      return
    }

    const script = existingScript ?? document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.loaded = 'false'
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error(`Could not load ${src}`))

    if (!existingScript) {
      document.head.appendChild(script)
    }
  })
}
