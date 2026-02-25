import BubblesCanvas from "./components/BubblesCanvas";
import { items } from "@/data/items";

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0">
        <BubblesCanvas items={items} />
      </div>

      {/* overlay (後で使う) */}
      <div className="pointer-events-none absolute left-6 top-6">
        <h1 className="text-white text-lg font-semibold tracking-wide">
          IKEA Bubbles
        </h1>
      </div>
      <footer className="fixed bottom-6 w-full text-center text-xs text-white/50 pointer-events-none">
        © 2026 Sakura Wallace · Personal non-commercial UI experiment · Product images © IKEA
      </footer>
    </main>
  );
}
