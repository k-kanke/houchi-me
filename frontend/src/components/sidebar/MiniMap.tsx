'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';

const W = 240;
const H = 150;

export default function MiniMap() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const avatars = useAppStore((s) => s.worldAvatars);
  const speaker = useAppStore((s) => s.currentSpeaker);
  const playerName = useAppStore((s) => s.clone?.name ?? 'Mira');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // bg
      const grd = ctx.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, 'rgba(163,120,255,0.06)');
      grd.addColorStop(1, 'rgba(79,245,231,0.04)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // locations
      const locations: { name: string; x: number; y: number }[] = [
        { name: '中央', x: W / 2, y: H / 2 },
        { name: '東書架', x: W * 0.78, y: H * 0.55 },
        { name: '西書架', x: W * 0.22, y: H * 0.55 },
        { name: '天窓', x: W / 2, y: H * 0.18 },
        { name: '集会場', x: W / 2, y: H * 0.85 },
      ];
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      locations.forEach((l) => {
        ctx.fillText(l.name, l.x - 12, l.y - 6);
        ctx.beginPath();
        ctx.arc(l.x, l.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fill();
      });

      // avatars
      const palette: Record<string, [string, string]> = {
        mira: ['#a378ff', '#4ff5e7'],
        sage: ['#ff6ec7', '#ffc774'],
        echo: ['#74ffa8', '#4ff5e7'],
      };
      const list =
        avatars.length > 0
          ? avatars
          : [
              {
                id: 'mira',
                name: playerName,
                position: [0, 0, 0] as [number, number, number],
                rotationY: 0,
                activity: '',
              },
              {
                id: 'sage',
                name: 'Sage',
                position: [3, 0, -1] as [number, number, number],
                rotationY: 0,
                activity: '',
              },
              {
                id: 'echo',
                name: 'Echo',
                position: [-3, 0, 1] as [number, number, number],
                rotationY: 0,
                activity: '',
              },
            ];
      list.forEach((a, i) => {
        const x = W / 2 + a.position[0] * 14;
        const y = H / 2 + a.position[2] * 14;
        const [c1, c2] = palette[a.id] ?? ['#fff', '#fff'];
        if (i === speaker) {
          ctx.beginPath();
          ctx.arc(x, y, 8 + 2 * Math.sin(Date.now() / 200), 0, Math.PI * 2);
          ctx.strokeStyle = c1;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 5);
        grad.addColorStop(0, c2);
        grad.addColorStop(1, c1);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '8px "Inter", sans-serif';
        ctx.fillText(a.name, x + 6, y + 3);
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [avatars, speaker, playerName]);

  return (
    <div className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
          Mini Map
        </div>
        <div className="font-mono text-[10px] text-white/40">
          3 / 12 active
        </div>
      </div>
      <canvas
        ref={ref}
        style={{ width: W, height: H }}
        className="rounded-xl border border-white/[0.06]"
      />
    </div>
  );
}
