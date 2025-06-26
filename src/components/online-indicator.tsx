'use client';

import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
    isOnline: boolean;
    showText?: boolean;
    className?: string;
}

export function OnlineIndicator({ isOnline, showText = false, className }: OnlineIndicatorProps) {
    if (!isOnline) {
        return null;
    }

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            {showText && <span className="text-xs text-muted-foreground">Online</span>}
        </div>
    );
}
