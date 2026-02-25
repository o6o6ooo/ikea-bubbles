"use client";

import { useMemo, useEffect, useState } from "react";
import BubblesCanvas from "./components/BubblesCanvas";
import { items } from "@/data/items";

function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const visibleItems = useMemo(() => {
    if (!isMobile) return items;
    return shuffleArray(items).slice(0, 30);
  }, [isMobile]);

  return (
    <main className="relative min-h-svh w-screen overflow-hidden">
      <div className="absolute inset-0">
        <BubblesCanvas items={visibleItems} />
      </div>

      <div className="pointer-events-none absolute left-6 top-6">
        <h1 className="text-white text-xl font-semibold tracking-tight">
          IKEA Bubbles
        </h1>
      </div>

      <footer className="fixed bottom-6 w-full text-center text-xs text-white/50 pointer-events-none">
        © 2026 Sakura Wallace · Personal non-commercial UI experiment · Product images © IKEA
      </footer>
    </main>
  );
}
