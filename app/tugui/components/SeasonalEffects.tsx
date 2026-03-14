'use client';

import { useEffect, useRef } from 'react';
import { Season } from '../types';

type ParticleKind = 'sakura' | 'leaf' | 'snowflake' | 'raindrop';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  accent: string;
  angle: number;
  spin: number;
  opacity: number;
  swaySpeed: number;
  swayPhase: number;
  swayAmount: number;
  kind: ParticleKind;
}

const PARTICLE_COUNT: Record<Season, number> = {
  spring: 68,
  summer: 220,
  autumn: 30,
  winter: 132,
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createParticle(width: number, height: number, season: Season, startAtTop: boolean): Particle {
  const x = randomBetween(-20, width + 20);
  const y = startAtTop ? randomBetween(-80, -8) : randomBetween(-80, height);

  if (season === 'spring') {
    return {
      x, y,
      vx: randomBetween(-0.15, 0.6),
      vy: randomBetween(0.45, 1.2),
      size: randomBetween(8, 14),
      color: Math.random() > 0.3 ? '#f8b6c8' : '#ffd3de',
      accent: '#ffd966',
      angle: randomBetween(0, Math.PI * 2),
      spin: randomBetween(-0.018, 0.018),
      opacity: randomBetween(0.6, 0.95),
      swaySpeed: randomBetween(0.001, 0.0025),
      swayPhase: randomBetween(0, Math.PI * 2),
      swayAmount: randomBetween(0.4, 1.2),
      kind: 'sakura',
    };
  }

  if (season === 'summer') {
    return {
      x, y,
      vx: randomBetween(-0.3, -0.1),   // 微微向左倾斜
      vy: randomBetween(8, 16),          // 快速下落
      size: randomBetween(8, 20),        // 雨滴长度
      color: `rgba(${140 + Math.floor(Math.random() * 40)}, ${180 + Math.floor(Math.random() * 40)}, 255, 1)`,
      accent: 'rgba(180, 210, 255, 0.5)',
      angle: 0,
      spin: 0,
      opacity: randomBetween(0.25, 0.65),
      swaySpeed: 0,
      swayPhase: 0,
      swayAmount: 0,
      kind: 'raindrop',
    };
  }

  if (season === 'autumn') {
    return {
      x, y,
      vx: randomBetween(-0.55, 0.55),
      vy: randomBetween(0.75, 1.6),
      size: randomBetween(9, 16),
      color: ['#d2671f', '#bf4e23', '#e8982f', '#ad3a2d'][Math.floor(Math.random() * 4)],
      accent: '#7d3417',
      angle: randomBetween(0, Math.PI * 2),
      spin: randomBetween(-0.03, 0.03),
      opacity: randomBetween(0.72, 0.98),
      swaySpeed: randomBetween(0.001, 0.0024),
      swayPhase: randomBetween(0, Math.PI * 2),
      swayAmount: randomBetween(0.5, 1.8),
      kind: 'leaf',
    };
  }

  return {
    x, y,
    vx: randomBetween(-0.28, 0.28),
    vy: randomBetween(0.45, 1.05),
    size: randomBetween(5, 9),
    color: '#f6fbff',
    accent: '#d8ecff',
    angle: randomBetween(0, Math.PI * 2),
    spin: randomBetween(-0.01, 0.01),
    opacity: randomBetween(0.5, 0.92),
    swaySpeed: randomBetween(0.0008, 0.0018),
    swayPhase: randomBetween(0, Math.PI * 2),
    swayAmount: randomBetween(0.25, 0.9),
    kind: 'snowflake',
  };
}

function drawSakura(ctx: CanvasRenderingContext2D, particle: Particle) {
  const petalRadius = particle.size * 0.45;
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * i) / 5);
    ctx.beginPath();
    ctx.ellipse(0, -particle.size * 0.5, petalRadius * 0.72, petalRadius * 1.1, 0, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, particle.size * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = particle.accent;
  ctx.fill();
}

function drawLeaf(ctx: CanvasRenderingContext2D, particle: Particle) {
  ctx.beginPath();
  ctx.moveTo(0, -particle.size * 0.95);
  ctx.bezierCurveTo(particle.size * 0.9, -particle.size * 0.45, particle.size * 0.65, particle.size * 0.75, 0, particle.size);
  ctx.bezierCurveTo(-particle.size * 0.65, particle.size * 0.75, -particle.size * 0.9, -particle.size * 0.45, 0, -particle.size * 0.95);
  ctx.fillStyle = particle.color;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -particle.size * 0.8);
  ctx.lineTo(0, particle.size * 0.9);
  ctx.strokeStyle = particle.accent;
  ctx.lineWidth = Math.max(1, particle.size * 0.09);
  ctx.stroke();
}

function drawSnowflake(ctx: CanvasRenderingContext2D, particle: Particle) {
  const arm = particle.size;
  ctx.strokeStyle = particle.color;
  ctx.lineWidth = Math.max(1, arm * 0.2);
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = Math.cos(angle) * arm;
    const y = Math.sin(angle) * arm;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.stroke();
    const branchBackX = x * 0.6;
    const branchBackY = y * 0.6;
    const branchLen = arm * 0.32;
    const left = angle + Math.PI * 0.72;
    const right = angle - Math.PI * 0.72;
    ctx.beginPath();
    ctx.moveTo(branchBackX, branchBackY);
    ctx.lineTo(branchBackX + Math.cos(left) * branchLen, branchBackY + Math.sin(left) * branchLen);
    ctx.moveTo(branchBackX, branchBackY);
    ctx.lineTo(branchBackX + Math.cos(right) * branchLen, branchBackY + Math.sin(right) * branchLen);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(1, arm * 0.16), 0, Math.PI * 2);
  ctx.fillStyle = particle.accent;
  ctx.fill();
}

function drawRaindrop(ctx: CanvasRenderingContext2D, particle: Particle) {
  // 细长线段模拟雨滴，微微倾斜
  const len = particle.size;
  const dx = -len * 0.15;
  const dy = len;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(dx, dy);
  ctx.strokeStyle = particle.color;
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.stroke();
}

export default function SeasonalEffects({ season }: { season: Season }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(undefined);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = document.documentElement.scrollHeight;
    const dpr = window.devicePixelRatio || 1;

    const syncCanvasSize = () => {
      const newWidth = window.innerWidth;
      const newHeight = document.documentElement.scrollHeight;

      if (newWidth === width && newHeight === height) return;
      width = newWidth;
      height = newHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(PARTICLE_COUNT[season] * (height / Math.max(window.innerHeight, 1)));
      particlesRef.current = Array.from({ length: count }, () =>
        createParticle(width, height, season, false)
      );
    };

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const initCount = Math.round(PARTICLE_COUNT[season] * (height / Math.max(window.innerHeight, 1)));
    particlesRef.current = Array.from({ length: initCount }, () =>
      createParticle(width, height, season, false)
    );

    window.addEventListener('resize', syncCanvasSize);
    const ro = new ResizeObserver(syncCanvasSize);
    ro.observe(document.body);

    let lastTime = performance.now();

    const draw = (time: number) => {
      const dt = Math.min((time - lastTime) / 16, 2);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      particlesRef.current.forEach((particle, index) => {
        particle.x += (particle.vx + Math.sin(time * particle.swaySpeed + particle.swayPhase) * particle.swayAmount) * dt;
        particle.y += particle.vy * dt;
        particle.angle += particle.spin * dt;

        if (particle.y > height + 80 || particle.x > width + 80 || particle.x < -80) {
          particlesRef.current[index] = createParticle(width, height, season, true);
          return;
        }

        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.translate(particle.x, particle.y);
        if (particle.kind !== 'raindrop') ctx.rotate(particle.angle);

        if (particle.kind === 'sakura') drawSakura(ctx, particle);
        else if (particle.kind === 'leaf') drawLeaf(ctx, particle);
        else if (particle.kind === 'raindrop') drawRaindrop(ctx, particle);
        else drawSnowflake(ctx, particle);

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', syncCanvasSize);
      ro.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [season]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 30,
        opacity: season === 'summer' ? 0.75 : 0.5,
      }}
      aria-hidden="true"
    />
  );
}
