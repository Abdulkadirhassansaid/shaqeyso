import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      className={cn(
        "h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary",
        className
      )}
    >
        <span className="sr-only">Loading...</span>
    </div>
  );
}
