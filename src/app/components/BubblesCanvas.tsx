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

      // internal pixel size
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);

      // CSS size
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // draw in CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initBubbles = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;

      const cx = cw / 2;
      const cy = ch / 2;

      // 密集度：小さいほどギュッとする
      const spread = Math.min(cw, ch) * 0.18;

      const baseR = 40;

      // ✅ archived を除外
      const visibleItems = items.filter((item) => !item.archived);

      bubbles = visibleItems.map((item) => {
        const img = new Image();
        // ✅ id とファイル名を一致させる: public/items/<id>.jpg
        img.src = `/items/${item.id}.jpg`;
        img.decoding = "async";

        return {
          item,
          img,
          // ✅ 中央寄せクラスター
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
      // Clip circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const iw = b.img.naturalWidth;
      const ih = b.img.naturalHeight;

      // ✅ 画像がまだロードされてない場合はプレースホルダー
      if (!iw || !ih) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fill();
        ctx.restore();
        return;
      }

      // Cover (object-fit: cover)
      const size = b.r * 2;
      const scale = Math.max(size / iw, size / ih);
      const w = iw * scale;
      const h = ih * scale;

      ctx.drawImage(b.img, b.x - w / 2, b.y - h / 2, w, h);
      ctx.restore();
    };

    const tick = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;

      // background
      ctx.fillStyle = "#0058A3";
      ctx.fillRect(0, 0, cw, ch);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const b of bubbles) {
        // hover radius animation
        const dx = mx - b.x;
        const dy = my - b.y;
        const dist = Math.hypot(dx, dy);

        b.rTarget = dist < b.r ? 55 : 40;
        b.r += (b.rTarget - b.r) * 0.12;

        // movement
        b.x += b.vx;
        b.y += b.vy;

        // friction (Appleっぽいヌルっと感)
        b.vx *= 0.995;
        b.vy *= 0.995;

        // bounce
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

        // rim (白い縁があるとIKEA商品写真が締まる)
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();

        // image
        drawBubbleImageCover(b);

        // hover highlight
        if (dist < b.r) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r + 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onResize = () => {
      setupCanvasSize();
      initBubbles(); // ✅ リサイズ時に再配置（少数でも見栄え優先）
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
