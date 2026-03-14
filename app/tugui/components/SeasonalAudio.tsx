'use client';

import { useEffect, useRef, useState } from 'react';
import { Season } from '../types';

interface SeasonalAudioProps {
    season: Season;
}

// 粉红噪声（用于雨声、风声）
function createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        b6 = w * 0.115926;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    }
    return buffer;
}

// 钟/风铃音调（非整数谐波，带自然衰减）
function playChime(ctx: AudioContext, freq: number, gain: number, when: number, nodes: AudioNode[]) {
    [1, 2.076, 3.011, 4.148].forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * ratio;
        const dur = 2.2 / (i * 0.7 + 1);
        const g = gain * [1, 0.4, 0.18, 0.07][i];
        env.gain.setValueAtTime(0, when);
        env.gain.linearRampToValueAtTime(g, when + 0.004);
        env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        osc.connect(env);
        env.connect(ctx.destination);
        osc.start(when);
        osc.stop(when + dur + 0.05);
        nodes.push(osc, env);
    });
}

function createSeasonalAudio(ctx: AudioContext, season: Season): (() => void) {
    const nodes: AudioNode[] = [];
    const tids: ReturnType<typeof setTimeout>[] = [];

    const stopAll = () => {
        tids.forEach(id => clearTimeout(id));
        tids.length = 0;
        nodes.forEach(n => {
            try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* ignore */ }
            try { n.disconnect(); } catch { /* ignore */ }
        });
    };

    if (season === 'spring') {
        // 春：鸟鸣（正弦滑音，五声音阶）
        const freqs = [659.25, 783.99, 880.00, 1046.50, 1174.66];
        const scheduleBird = (idx: number) => {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'sine';
            const f = freqs[Math.floor(Math.random() * freqs.length)];
            const t = ctx.currentTime;
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.linearRampToValueAtTime(f * 1.1, t + 0.07);
            osc.frequency.linearRampToValueAtTime(f * 0.97, t + 0.18);
            env.gain.setValueAtTime(0, t);
            env.gain.linearRampToValueAtTime(0.025, t + 0.03);
            env.gain.linearRampToValueAtTime(0, t + 0.22);
            osc.connect(env);
            env.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.25);
            nodes.push(osc, env);
            tids.push(setTimeout(() => scheduleBird(idx), (2.5 + Math.random() * 5 + idx * 0.7) * 1000));
        };
        [0, 1, 2].forEach(i => tids.push(setTimeout(() => scheduleBird(i), i * 800 + Math.random() * 500)));

    } else if (season === 'summer') {
        // 夏：小雨声（粉红噪声 + 带通）
        const buf = createPinkNoiseBuffer(ctx);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const lo = ctx.createBiquadFilter();
        lo.type = 'lowpass';
        lo.frequency.value = 2200;
        const hi = ctx.createBiquadFilter();
        hi.type = 'highpass';
        hi.frequency.value = 350;
        const g = ctx.createGain();
        g.gain.value = 0.022;
        src.connect(lo); lo.connect(hi); hi.connect(g); g.connect(ctx.destination);
        src.start();
        nodes.push(src, lo, hi, g);

    } else if (season === 'autumn') {
        // 秋：风铃（C大调五声，中音区）
        const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
        const schedule = () => {
            const f = pentatonic[Math.floor(Math.random() * pentatonic.length)];
            playChime(ctx, f, 0.05, ctx.currentTime, nodes);
            if (Math.random() > 0.55) {
                const f2 = pentatonic[Math.floor(Math.random() * pentatonic.length)];
                playChime(ctx, f2, 0.035, ctx.currentTime + 0.55, nodes);
            }
            tids.push(setTimeout(schedule, (2.5 + Math.random() * 5) * 1000));
        };
        tids.push(setTimeout(schedule, 500));

    } else if (season === 'winter') {
        // 冬：轻微风声（粉红噪声 + 低通 + LFO起伏）
        const buf = createPinkNoiseBuffer(ctx);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 480;
        const g = ctx.createGain();
        g.gain.value = 0.018;
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.06;
        const lfoG = ctx.createGain();
        lfoG.gain.value = 0.007;
        lfo.connect(lfoG);
        lfoG.connect(g.gain);
        lfo.start();
        src.connect(filter); filter.connect(g); g.connect(ctx.destination);
        src.start();
        nodes.push(src, filter, g, lfo, lfoG);
    }

    return stopAll;
}

export default function SeasonalAudio({ season }: SeasonalAudioProps) {
    // 默认静音，用户点击后才播放，避免浏览器自动播放拦截
    const [muted, setMuted] = useState(true);
    const ctxRef = useRef<AudioContext | null>(null);
    const stopRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (muted) {
            stopRef.current?.();
            stopRef.current = null;
            return;
        }

        // 在用户手势之后才创建/恢复 AudioContext
        if (!ctxRef.current) ctxRef.current = new AudioContext();
        const ctx = ctxRef.current;
        ctx.resume().catch(() => { });

        stopRef.current?.();
        stopRef.current = createSeasonalAudio(ctx, season);

        return () => {
            stopRef.current?.();
            stopRef.current = null;
        };
    }, [muted, season]);

    useEffect(() => {
        return () => {
            stopRef.current?.();
            ctxRef.current?.close();
        };
    }, []);

    const label: Record<Season, string> = {
        spring: '🐦 春日鸟鸣',
        summer: '�️ 夏日小雨',
        autumn: '� 秋日风铃',
        winter: '❄️ 冬日寒风',
    };

    return (
        <button
            onClick={() => setMuted(m => !m)}
            title={muted ? `开启环境音：${label[season]}` : '关闭环境音'}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999,
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1.5px solid rgba(139, 105, 20, 0.5)',
                background: 'rgba(255, 253, 248, 0.92)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 2px 12px rgba(139, 105, 20, 0.15)',
                transition: 'all 0.2s ease',
            }}
            aria-label={muted ? '开启环境音' : '关闭环境音'}
        >
            {muted ? '🔇' : '🔊'}
        </button>
    );
}
