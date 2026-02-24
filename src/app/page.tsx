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
        <h1 className="text-white text-xl font-semibold tracking-tight">
          IKEA Bubbles
        </h1>
      </div>
    </main>
  );
}
