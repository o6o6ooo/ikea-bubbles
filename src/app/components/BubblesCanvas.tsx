"use client";

import { useEffect, useRef } from "react";
import type { IkeaItem } from "@/data/items";

type Bubble = {
  item: IkeaItem;
  img: HTMLImageElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rTarget: number;
};

export default function BubblesCanvas({ items }: { items: IkeaItem[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let rafId = 0;
    let bubbles: Bubble[] = [];

    const setupCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initBubbles = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;

      const cx = cw / 2;
      const cy = ch / 2;

      const spread = Math.min(cw, ch) * 0.18;
      const baseR = 40;

      const visibleItems = items.filter((item) => !item.archived);

      bubbles = visibleItems.map((item) => {
        const img = new Image();
        img.src = `/items/${item.id}.jpg`;
        img.decoding = "async";

        return {
          item,
          img,
          x: cx + (Math.random() - 0.5) * spread * 2,
          y: cy + (Math.random() - 0.5) * spread * 2,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: baseR,
          rTarget: baseR,
        };
      });
    };

    const drawBubbleImageCover = (b: Bubble) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const iw = b.img.naturalWidth;
      const ih = b.img.naturalHeight;

      if (!iw || !ih) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fill();
        ctx.restore();
        return;
      }

      const size = b.r * 2;
      const scale = Math.max(size / iw, size / ih);
      const w = iw * scale;
      const h = ih * scale;

      ctx.drawImage(b.img, b.x - w / 2, b.y - h / 2, w, h);
      ctx.restore();
    };

    const applyRepulsion = (cw: number, ch: number) => {
      const padding = 2;
      const strength = 0.35;

      for (let i = 0; i < bubbles.length; i++) {
        const a = bubbles[i];
        for (let j = i + 1; j < bubbles.length; j++) {
          const b = bubbles[j];

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;

          const minDist = a.rTarget + b.rTarget + padding;

          if (dist < minDist) {
            const nx = dx / dist;
            const ny = dy / dist;

            const overlap = minDist - dist;

            const push = overlap * 0.5 * strength;
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;

            const vpush = overlap * 0.0008 * strength;
            a.vx -= nx * vpush;
            a.vy -= ny * vpush;
            b.vx += nx * vpush;
            b.vy += ny * vpush;
          }
        }

        a.x = Math.max(a.r, Math.min(cw - a.r, a.x));
        a.y = Math.max(a.r, Math.min(ch - a.r, a.y));
      }
    };

    const tick = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // hover判定（拡大だけに使う）
      for (const b of bubbles) {
        const dx = mx - b.x;
        const dy = my - b.y;
        const dist = Math.hypot(dx, dy);

        b.rTarget = dist < b.r ? 55 : 40;
      }

      applyRepulsion(cw, ch);

      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, "#0E3B73");  // 少し濃い
      grad.addColorStop(1, "#0A4DA2");  // IKEAブルー

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      for (const b of bubbles) {
        b.r += (b.rTarget - b.r) * 0.12;

        b.x += b.vx;
        b.y += b.vy;

        b.vx *= 0.995;
        b.vy *= 0.995;

        if (b.x < b.r) {
          b.x = b.r;
          b.vx *= -1;
        } else if (b.x > cw - b.r) {
          b.x = cw - b.r;
          b.vx *= -1;
        }

        if (b.y < b.r) {
          b.y = b.r;
          b.vy *= -1;
        } else if (b.y > ch - b.r) {
          b.y = ch - b.r;
          b.vy *= -1;
        }

        // ✅ 枠なし：影だけで浮かせる（境界を綺麗に見せる）
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        // 影を出すためのダミー塗り（透明に近くして影だけ出す）
        ctx.fillStyle = "rgba(0,0,0,0.01)";
        ctx.fill();

        ctx.restore();

        // image
        drawBubbleImageCover(b);
      }

      rafId = requestAnimationFrame(tick);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onResize = () => {
      setupCanvasSize();
      initBubbles();
    };

    setupCanvasSize();
    initBubbles();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
    };
  }, [items]);

  return <canvas ref={canvasRef} className="block h-screen w-screen" />;
}
