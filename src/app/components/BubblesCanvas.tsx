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

  // ✅ クリックで選択（stateにするとeffect再実行の原因になりがちなのでrefで持つ）
  const selectedIdRef = useRef<string | null>(null);

  // ✅ bubblesを保持（クリックで作り直さない）
  const bubblesRef = useRef<Bubble[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let rafId = 0;

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

      const bubbles: Bubble[] = visibleItems.map((item) => {
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

      bubblesRef.current = bubbles;
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

      const bubbles = bubblesRef.current;

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

    // ✅ 円の中にテキストを折り返して描画
    const wrapLines = (text: string, maxWidth: number) => {
      const words = text.split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let line = "";

      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width <= maxWidth) {
          line = test;
        } else {
          if (line) lines.push(line);
          line = w;
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    const drawSelectedOverlayText = (b: Bubble) => {
      const padding = 14;
      const maxW = b.r * 2 - padding * 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // うっすら暗くして文字を読みやすく
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);

      // text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.95)";

      const title = b.item.name ?? "";
      const desc = b.item.description ?? "";

      // title
      ctx.font = "600 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      const titleY = b.y - 10;
      ctx.fillText(title, b.x, titleY);

      // description (wrap)
      ctx.font = "400 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      const lines = wrapLines(desc, maxW).slice(0, 3); // 最大3行くらい
      const lineH = 16;
      const startY = b.y + 14 - ((lines.length - 1) * lineH) / 2;

      lines.forEach((ln, i) => {
        ctx.fillText(ln, b.x, startY + i * lineH);
      });

      ctx.restore();
    };

    const pickBubbleIdAt = (x: number, y: number) => {
      // 大きい順で当たり判定（選択中がでかいのでクリックしやすくなる）
      const bubbles = [...bubblesRef.current].sort((a, b) => b.r - a.r);
      for (const b of bubbles) {
        const dx = x - b.x;
        const dy = y - b.y;
        if (Math.hypot(dx, dy) <= b.r) return b.item.id;
      }
      return null;
    };

    const tick = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      const selectedId = selectedIdRef.current;
      const bubbles = bubblesRef.current;

      // hover/selected のターゲット半径
      for (const b of bubbles) {
        if (selectedId && b.item.id === selectedId) {
          b.rTarget = 92; // ✅ クリックでさらに大きく
          continue;
        }

        const dx = mx - b.x;
        const dy = my - b.y;
        const dist = Math.hypot(dx, dy);

        b.rTarget = dist < b.r ? 55 : 40;
      }

      applyRepulsion(cw, ch);

      // background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, "#0E3B73");
      grad.addColorStop(1, "#0A4DA2");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      for (const b of bubbles) {
        const lerp = selectedId && b.item.id === selectedId ? 0.16 : 0.12;
        b.r += (b.rTarget - b.r) * lerp;

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

        // shadow only
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.22)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.01)";
        ctx.fill();
        ctx.restore();

        drawBubbleImageCover(b);

        // ✅ 選択中だけ円の中にテキスト
        if (selectedId && b.item.id === selectedId) {
          drawSelectedOverlayText(b);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onClick = (e: MouseEvent) => {
      const id = pickBubbleIdAt(e.clientX, e.clientY);
      if (!id) return;
      selectedIdRef.current = selectedIdRef.current === id ? null : id; // nullなら解除（クリック外）
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") selectedIdRef.current = null;
    };

    const onResize = () => {
      setupCanvasSize();
      initBubbles(); // ✅ リサイズのときだけ並び直し
    };

    setupCanvasSize();
    initBubbles();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [items]);

  return <canvas ref={canvasRef} className="block h-screen w-screen" />;
}
