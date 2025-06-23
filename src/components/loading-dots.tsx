import { cn } from "@/lib/utils";

const DURATION = 1.5;
const STAGGER = 0.25;
const DOTS = 3;

export function LoadingDots() {
  return (
    <div className="flex" style={{ gap: "0.25rem" }}>
      {Array.from({ length: DOTS }).map((_, i) => (
        <div
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-primary"
          style={{ animationDelay: `${i * STAGGER}s` }}
        />
      ))}
    </div>
  );
}
