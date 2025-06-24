
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from '@/hooks/use-loading';

export function PageProgress() {
  const { setIsLoading } = useLoading();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Hide the loader whenever the path changes.
    setIsLoading(false);
  }, [pathname, searchParams, setIsLoading]);

  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a');
      
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
        
        // Only show loader for navigations to a different page.
        if (targetUrl.href !== currentUrl.href) {
            setIsLoading(true);
        }
      }
    };
    
    // Listen for clicks on the document to capture navigation.
    document.addEventListener('click', handleAnchorClick);
    
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, [setIsLoading]);

  return null;
}
