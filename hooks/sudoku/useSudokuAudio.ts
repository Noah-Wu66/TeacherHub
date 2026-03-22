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

const BGM_LOOP_MS = 6000

// 古风五声音阶: C4, D4, E4, G4, A4 (261.63, 293.66, 329.63, 392.00, 440.00)
// 配合一些低音增加厚度
const BGM_CHORDS = [
  [196.00, 261.63, 329.63], // G3, C4, E4
  [220.00, 293.66, 392.00], // A3, D4, G4
  [196.00, 261.63, 440.00], // G3, C4, A4
  [261.63, 329.63, 392.00], // C4, E4, G4
]

const BGM_MELODIES = [
  [523.25, 587.33, 659.25, 523.25], // C5, D5, E5, C5
  [440.00, 523.25, 392.00, 440.00], // A4, C5, G4, A4
  [392.00, 440.00, 329.63, 392.00], // G4, A4, E4, G4
  [659.25, 587.33, 523.25, 440.00], // E5, D5, C5, A4
]

const BGM_OFFSETS = [0.2, 1.2, 2.5, 3.8]

function disconnectNode(node: AudioNode | null) {
  if (!node) return
  try {
    node.disconnect()
  } catch {}
}

export function useSudokuAudio(isPlaying: boolean) {
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
    const startAt = context.currentTime + 0.05

    // 和弦，模拟古琴拨弦的回音
    chord.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()
      const nodes = [oscillator, filter, gain]

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, startAt)

      filter.type = 'lowpass'
      filter.frequency.value = 1000
      filter.Q.value = 0.5

      const peak = 0.03 - index * 0.005
      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.linearRampToValueAtTime(peak, startAt + 0.8)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 5.5)

      oscillator.connect(filter)
      filter.connect(gain)
      gain.connect(bgmGain)

      rememberNodes(nodes)
      oscillator.onended = () => releaseNodes(nodes)

      oscillator.start(startAt)
      oscillator.stop(startAt + 5.6)
    })

    // 旋律，模拟竹笛或清脆的铃音
    melody.forEach((frequency, index) => {
      const noteTime = startAt + BGM_OFFSETS[index]
      const oscillator = context.createOscillator()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()
      const nodes = [oscillator, filter, gain]

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(frequency, noteTime)

      filter.type = 'bandpass'
      filter.frequency.value = frequency
      filter.Q.value = 1.2

      gain.gain.setValueAtTime(0.0001, noteTime)
      gain.gain.linearRampToValueAtTime(0.02, noteTime + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.2)

      oscillator.connect(filter)
      filter.connect(gain)
      gain.connect(bgmGain)

      rememberNodes(nodes)
      oscillator.onended = () => releaseNodes(nodes)

      oscillator.start(noteTime)
      oscillator.stop(noteTime + 1.3)
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

  // 落子（输入数字）的音效：清脆短促的木质敲击声/铃声
  const playInput = useCallback(() => {
    playSequence([{ offset: 0, duration: 0.1, frequency: 523.25, endFrequency: 587.33, volume: 0.066, type: 'triangle' }])
  }, [playSequence])

  // 选中格子的音效：轻微的滴答声
  const playSelect = useCallback(() => {
    playSequence([{ offset: 0, duration: 0.06, frequency: 440, endFrequency: 392, volume: 0.04, type: 'sine', filterFrequency: 2000 }])
  }, [playSequence])

  // 擦除的音效：低沉的扫弦
  const playClear = useCallback(() => {
    playSequence([
      { offset: 0, duration: 0.1, frequency: 329.63, endFrequency: 261.63, volume: 0.05 },
      { offset: 0.04, duration: 0.12, frequency: 261.63, endFrequency: 196.00, volume: 0.043 },
    ])
  }, [playSequence])

  // 错误的音效：沉闷的鼓声/警示
  const playError = useCallback(() => {
    playSequence([
      { offset: 0, duration: 0.15, frequency: 220, endFrequency: 180, volume: 0.07, type: 'sawtooth', filterFrequency: 800 },
      { offset: 0.08, duration: 0.18, frequency: 196, endFrequency: 130, volume: 0.064, type: 'triangle', filterFrequency: 600 },
    ])
  }, [playSequence])

  // 锦囊提示音效：空灵的泛音
  const playHint = useCallback(() => {
    playSequence([
      { offset: 0, duration: 0.12, frequency: 587.33, endFrequency: 659.25, volume: 0.06, type: 'sine' },
      { offset: 0.1, duration: 0.2, frequency: 880.00, endFrequency: 1046.50, volume: 0.068, type: 'triangle' },
    ])
  }, [playSequence])

  // 破局成功音效：昂扬的五声琵琶轮指/琶音
  const playSuccess = useCallback(() => {
    playSequence([
      { offset: 0.00, duration: 0.15, frequency: 523.25, endFrequency: 587.33, volume: 0.08, type: 'triangle' }, // C5 -> D5
      { offset: 0.12, duration: 0.15, frequency: 587.33, endFrequency: 659.25, volume: 0.086, type: 'triangle' }, // D5 -> E5
      { offset: 0.24, duration: 0.15, frequency: 659.25, endFrequency: 783.99, volume: 0.09, type: 'triangle' }, // E5 -> G5
      { offset: 0.36, duration: 0.40, frequency: 783.99, endFrequency: 1046.5, volume: 0.1, type: 'sine' },      // G5 -> C6
    ])
  }, [playSequence])

  return {
    playInput,
    playSelect,
    playClear,
    playError,
    playHint,
    playSuccess,
  }
}
