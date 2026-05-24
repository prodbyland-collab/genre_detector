declare module 'essentia.js/dist/essentia.js-core.es.js' {
  export default class Essentia {
    constructor(EssentiaWASM: unknown, isDebug?: boolean)
    arrayToVector(inputArray: Float32Array): unknown
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
}

declare module 'essentia.js/dist/essentia-wasm.es.js' {
  export const EssentiaWASM: {
    calledRun?: boolean
    onRuntimeInitialized?: () => void
  }
}
