'use client'

import { useCallback, useEffect, useRef } from 'react'

interface ToneStep {
  offset: number
  duration: number
  frequency: number
  endFrequency?: number
  volume: number
  type?: OscillatorType
  filterFrequency?: number
}

const BGM_LOOP_MS = 3200

const BGM_CHORDS = [
  [220, 261.63, 329.63],
  [196, 246.94, 293.66],
  [174.61, 220, 261.63],
  [196, 246.94, 329.63],
]

const BGM_MELODIES = [
  [523.25, 659.25, 587.33, 659.25],
  [493.88, 587.33, 523.25, 587.33],
  [440, 523.25, 493.88, 523.25],
  [493.88, 659.25, 587.33, 659.25],
]

const BGM_OFFSETS = [0.18, 0.82, 1.42, 2.06]

function disconnectNode(node: AudioNode | null) {
  if (!node) return
  try {
    node.disconnect()
  } catch {}
}

export function useGameAudio(isPlaying: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const bgmGainRef = useRef<GainNode | null>(null)
  const sfxGainRef = useRef<GainNode | null>(null)
  const bgmLoopRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bgmNodesRef = useRef<Array<AudioNode | AudioScheduledSourceNode>>([])
  const phraseIndexRef = useRef(0)
  const isPlayingRef = useRef(isPlaying)

  const stopBgm = useCallback(() => {
    if (bgmLoopRef.current) {
      clearInterval(bgmLoopRef.current)
      bgmLoopRef.current = null
    }

    bgmNodesRef.current.forEach((node) => {
      if ('stop' in node) {
        try {
          node.stop()
        } catch {}
      }
      disconnectNode(node)
    })

    bgmNodesRef.current = []
    phraseIndexRef.current = 0
  }, [])

  const rememberNodes = useCallback((nodes: Array<AudioNode | AudioScheduledSourceNode>) => {
    bgmNodesRef.current.push(...nodes)
  }, [])

  const releaseNodes = useCallback((nodes: Array<AudioNode | AudioScheduledSourceNode>) => {
    bgmNodesRef.current = bgmNodesRef.current.filter((node) => !nodes.includes(node))
    nodes.forEach((node) => disconnectNode(node))
  }, [])

  const getAudioContext = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current

    const context = new AudioContext()
    const masterGain = context.createGain()
    const bgmGain = context.createGain()
    const sfxGain = context.createGain()

    masterGain.gain.value = 1.45
    bgmGain.gain.value = 0.82
    sfxGain.gain.value = 1.9

    bgmGain.connect(masterGain)
    sfxGain.connect(masterGain)
    masterGain.connect(context.destination)

    audioContextRef.current = context
    masterGainRef.current = masterGain
    bgmGainRef.current = bgmGain
    sfxGainRef.current = sfxGain

    return context
  }, [])

  const scheduleBgmPhrase = useCallback(() => {
    const context = audioContextRef.current
    const bgmGain = bgmGainRef.current

    if (!context || context.state !== 'running' || !bgmGain) return

    const phraseIndex = phraseIndexRef.current % BGM_CHORDS.length
    phraseIndexRef.current += 1

    const chord = BGM_CHORDS[phraseIndex]
    const melody = BGM_MELODIES[phraseIndex]
    const startAt = context.currentTime + 0.03

    chord.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()
      const nodes = [oscillator, filter, gain]

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(frequency, startAt)

      filter.type = 'lowpass'
      filter.frequency.value = 1200
      filter.Q.value = 0.4

      const peak = 0.024 - index * 0.003
      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.linearRampToValueAtTime(peak, startAt + 0.42)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 2.6)

      oscillator.connect(filter)
      filter.connect(gain)
      gain.connect(bgmGain)

      rememberNodes(nodes)
      oscillator.onended = () => releaseNodes(nodes)

      oscillator.start(startAt)
      oscillator.stop(startAt + 2.68)
    })

    melody.forEach((frequency, index) => {
      const noteTime = startAt + BGM_OFFSETS[index]
      const oscillator = context.createOscillator()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()
      const nodes = [oscillator, filter, gain]

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, noteTime)

      filter.type = 'lowpass'
      filter.frequency.value = 2400
      filter.Q.value = 0.25

      gain.gain.setValueAtTime(0.0001, noteTime)
      gain.gain.linearRampToValueAtTime(0.016, noteTime + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.34)

      oscillator.connect(filter)
      filter.connect(gain)
      gain.connect(bgmGain)

      rememberNodes(nodes)
      oscillator.onended = () => releaseNodes(nodes)

      oscillator.start(noteTime)
      oscillator.stop(noteTime + 0.38)
    })
  }, [rememberNodes, releaseNodes])

  const syncBgm = useCallback(() => {
    const context = audioContextRef.current

    if (!context || context.state !== 'running') {
      if (!isPlayingRef.current) stopBgm()
      return
    }

    if (!isPlayingRef.current) {
      stopBgm()
      return
    }

    if (bgmLoopRef.current) return

    scheduleBgmPhrase()
    bgmLoopRef.current = setInterval(() => {
      scheduleBgmPhrase()
    }, BGM_LOOP_MS)
  }, [scheduleBgmPhrase, stopBgm])

  const unlockAudio = useCallback(async () => {
    const context = getAudioContext()

    if (context.state === 'suspended') {
      try {
        await context.resume()
      } catch {
        return null
      }
    }

    syncBgm()
    return context
  }, [getAudioContext, syncBgm])

  const playSequenceIfReady = useCallback((steps: ToneStep[]) => {
    const context = audioContextRef.current
    const sfxGain = sfxGainRef.current

    if (!context || context.state !== 'running' || !sfxGain) return

    const baseTime = context.currentTime + 0.01

    steps.forEach(({ offset, duration, frequency, endFrequency, volume, type = 'triangle', filterFrequency = 3200 }) => {
      const startAt = baseTime + offset
      const oscillator = context.createOscillator()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, startAt)
      if (endFrequency && endFrequency !== frequency) {
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startAt + duration)
      }

      filter.type = 'lowpass'
      filter.frequency.value = filterFrequency
      filter.Q.value = 0.5

      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(volume, startAt + Math.min(duration * 0.25, 0.035))
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

      oscillator.connect(filter)
      filter.connect(gain)
      gain.connect(sfxGain)

      oscillator.start(startAt)
      oscillator.stop(startAt + duration + 0.03)
      oscillator.onended = () => {
        disconnectNode(oscillator)
        disconnectNode(filter)
        disconnectNode(gain)
      }
    })
  }, [])

  const playSequence = useCallback((steps: ToneStep[]) => {
    void unlockAudio().then((context) => {
      if (!context) return
      playSequenceIfReady(steps)
    })
  }, [playSequenceIfReady, unlockAudio])

  useEffect(() => {
    isPlayingRef.current = isPlaying
    syncBgm()
  }, [isPlaying, syncBgm])

  useEffect(() => {
    return () => {
      stopBgm()
      const context = audioContextRef.current

      audioContextRef.current = null
      masterGainRef.current = null
      bgmGainRef.current = null
      sfxGainRef.current = null

      if (context) {
        void context.close()
      }
    }
  }, [stopBgm])

  const playStart = useCallback(() => {
    playSequence([
      { offset: 0, duration: 0.1, frequency: 392, endFrequency: 493.88, volume: 0.082 },
      { offset: 0.1, duration: 0.13, frequency: 523.25, endFrequency: 659.25, volume: 0.092 },
    ])
  }, [playSequence])

  const playNumber = useCallback(() => {
    playSequence([{ offset: 0, duration: 0.08, frequency: 520, endFrequency: 620, volume: 0.066, type: 'triangle' }])
  }, [playSequence])

  const playOperator = useCallback(() => {
    playSequence([{ offset: 0, duration: 0.08, frequency: 410, endFrequency: 470, volume: 0.06, type: 'square', filterFrequency: 2200 }])
  }, [playSequence])

  const playBackspace = useCallback(() => {
    playSequence([{ offset: 0, duration: 0.09, frequency: 360, endFrequency: 250, volume: 0.056 }])
  }, [playSequence])

  const playClear = useCallback(() => {
    playSequence([
      { offset: 0, duration: 0.1, frequency: 320, endFrequency: 220, volume: 0.05 },
      { offset: 0.03, duration: 0.12, frequency: 260, endFrequency: 180, volume: 0.043 },
    ])
  }, [playSequence])

  const playHint = useCallback(() => {
    playSequence([
      { offset: 0, duration: 0.1, frequency: 587.33, endFrequency: 659.25, volume: 0.06, type: 'sine' },
      { offset: 0.1, duration: 0.14, frequency: 783.99, endFrequency: 987.77, volume: 0.068, type: 'triangle' },
    ])
  }, [playSequence])

  const playSuccess = useCallback(() => {
    playSequence([
      { offset: 0, duration: 0.12, frequency: 523.25, endFrequency: 659.25, volume: 0.086, type: 'triangle' },
      { offset: 0.11, duration: 0.12, frequency: 659.25, endFrequency: 783.99, volume: 0.092, type: 'triangle' },
      { offset: 0.22, duration: 0.18, frequency: 783.99, endFrequency: 1046.5, volume: 0.1, type: 'sine' },
    ])
  }, [playSequence])

  const playError = useCallback(() => {
    playSequence([
      { offset: 0, duration: 0.13, frequency: 430, endFrequency: 280, volume: 0.07, type: 'sawtooth', filterFrequency: 1800 },
      { offset: 0.08, duration: 0.16, frequency: 260, endFrequency: 190, volume: 0.064, type: 'triangle', filterFrequency: 1400 },
    ])
  }, [playSequence])

  const playSkip = useCallback(() => {
    playSequence([
      { offset: 0, duration: 0.12, frequency: 392, endFrequency: 329.63, volume: 0.055, type: 'triangle' },
      { offset: 0.1, duration: 0.14, frequency: 329.63, endFrequency: 261.63, volume: 0.05, type: 'sine' },
    ])
  }, [playSequence])

  const playTimeout = useCallback(() => {
    playSequenceIfReady([
      { offset: 0, duration: 0.14, frequency: 349.23, endFrequency: 261.63, volume: 0.06, type: 'triangle' },
      { offset: 0.12, duration: 0.18, frequency: 261.63, endFrequency: 196, volume: 0.055, type: 'triangle' },
    ])
  }, [playSequenceIfReady])

  return {
    playStart,
    playNumber,
    playOperator,
    playBackspace,
    playClear,
    playHint,
    playSuccess,
    playError,
    playSkip,
    playTimeout,
  }
}
