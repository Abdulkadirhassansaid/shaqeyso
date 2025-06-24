
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

function TopProgressBar() {
  const [progress, setProgress] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);

  // A ref to hold the start and done methods
  const routerEventsRef = React.useRef<{
    start: () => void;
    done: () => void;
  } | null>(null);

  React.useEffect(() => {
    // This effect runs only once on the client to setup the event listeners
    let timer: NodeJS.Timeout | null = null;

    const start = () => {
      setIsVisible(true);
      setProgress(0);
      if (timer) clearInterval(timer);
      
      // Fake progress animation
      timer = setInterval(() => {
        setProgress(p => {
          if (p >= 90) {
            if (timer) clearInterval(timer);
            return p;
          }
          return p + 5 * Math.random();
        });
      }, 200);
    };

    const done = () => {
      if (timer) clearInterval(timer);
      setProgress(100);
      // Hide the bar after a short delay
      setTimeout(() => {
        setIsVisible(false);
        // Reset progress after fade out
        setTimeout(() => setProgress(0), 300);
      }, 300);
    };

    // Store methods in ref to be accessible by other effects
    routerEventsRef.current = { start, done };

    // Hijack history.pushState to trigger the progress bar
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      start();
      originalPushState.apply(history, args);
    };

    // Listen for back/forward navigation
    const handlePopState = () => {
      start();
    };
    window.addEventListener('popstate', handlePopState);

    // Cleanup function
    return () => {
      history.pushState = originalPushState;
      window.removeEventListener('popstate', handlePopState);
      if (timer) clearInterval(timer);
    };
  }, []);

  // On every route change, call 'done' to complete the progress bar
  const pathname = usePathname();
  React.useEffect(() => {
    routerEventsRef.current?.done();
  }, [pathname]);


  return (
    <div
      className="pointer-events-none fixed top-0 left-0 z-[9999] h-[3px] bg-primary transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        opacity: isVisible ? 1 : 0,
      }}
    />
  );
}

export { TopProgressBar as PageProgress };
