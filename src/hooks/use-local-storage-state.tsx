'use client';

import * as React from 'react';

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (state === undefined || state === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(state));
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
        if (event.newValue) {
          try {
            setState(JSON.parse(event.newValue) as T);
          } catch (error) {
            console.error(
              `Error parsing localStorage key “${key}” on change:`,
              error
            );
          }
        } else {
          // The key was removed from localStorage, so we reset to default
          setState(defaultValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue]);

  return [state, setState];
}
