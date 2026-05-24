import Essentia from 'essentia.js/dist/essentia.js-core.es.js'
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js'

type EssentiaInstance = InstanceType<typeof Essentia>

let essentiaPromise: Promise<EssentiaInstance> | null = null

export async function getEssentia() {
  if (!essentiaPromise) {
    essentiaPromise = waitForWasmRuntime().then(() => new Essentia(EssentiaWASM))
  }

  return essentiaPromise
}

function waitForWasmRuntime() {
  if (EssentiaWASM.calledRun) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const existingCallback = EssentiaWASM.onRuntimeInitialized
    EssentiaWASM.onRuntimeInitialized = () => {
      existingCallback?.()
      resolve()
    }
  })
}
