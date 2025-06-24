
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function PageProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // When the path changes, we're done with the navigation, so we stop the progress bar.
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // This effect runs only once on the client to set up the event listeners.
    NProgress.configure({ showSpinner: false });

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // A function to start the progress bar.
    const handleStart = () => {
      NProgress.start();
    };

    // We patch the history methods to trigger the progress bar on navigation.
    history.pushState = function (...args) {
      handleStart();
      originalPushState.apply(history, args);
    };
    
    // We don't start the progress on `replaceState` as it's often used for non-navigational URL updates.
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
    }

    // Listen for the browser's back/forward buttons.
    const handlePopState = () => {
      handleStart();
    };
    window.addEventListener('popstate', handlePopState);

    // The cleanup function restores the original history methods when the component unmounts.
    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null; // NProgress injects its own DOM elements, so this component renders nothing.
}
