
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function PageProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // When a new page is loaded, the navigation is done, so we stop the progress indicator.
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    // This effect runs once on the client to set up event listeners for NProgress.
    NProgress.configure({ showSpinner: true });

    const handleAnchorClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a');
      
      // Check if the click is on a valid anchor, for an internal navigation,
      // and not a command-click or special click.
      if (
        target &&
        target.href &&
        target.target !== '_blank' &&
        !event.ctrlKey &&
        !event.metaKey &&
        new URL(target.href).origin === window.location.origin
      ) {
        const currentUrl = new URL(location.href);
        const targetUrl = new URL(target.href);
        if (targetUrl.pathname !== currentUrl.pathname) {
          NProgress.start();
        }
      }
    };

    // Listen for clicks on the document to capture navigation initiated by <Link> components.
    document.addEventListener('click', handleAnchorClick);
    
    // Also listen for browser back/forward button clicks
    const handlePopState = () => {
      NProgress.start();
    };
    window.addEventListener('popstate', handlePopState);

    // Cleanup function to remove event listeners when the component unmounts.
    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null; // NProgress injects its own DOM elements into the body.
}
