import { useState, useEffect } from 'react';

export function useStorageExpenses() {
  // 1. Initialize state, safely handling Server-Side Rendering (SSR)

  const [fileName, setFileName] = useState('');
  const [storedValues, setStoredValues] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const item = localStorage.key(i);
        if (item && item?.startsWith('statement-')) {
          setFileName(item);
          return JSON.parse(localStorage.getItem(item));
        }
      }

      return [];
    } catch (error) {
      console.error(`Error reading localStorages":`, error);
      return [];
    }
  });

  // 2. Return a wrapped version of useState's setter function that persists the new value
  // const setValue = (value) => {
  //   try {
  //     // Allow value to be a function so we have the same API as useState
  //     const valueToStore = value instanceof Function ? value(storedValue) : value;

  //     setStoredValue(valueToStore);

  //     if (typeof window !== 'undefined') {
  //       window.localStorage.setItem(key, JSON.stringify(valueToStore));

  //       // Dispatch a custom event so other components in the SAME tab know to update
  //       window.dispatchEvent(new Event('local-storage-update'));
  //     }
  //   } catch (error) {
  //     console.error(`Error setting localStorage key "${key}":`, error);
  //   }
  // };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listener for cross-tab updates (native browser storage event)
    const handleStorageChange = (e) => {
      if (e.key.startsWith('statement-')) {
        setFileName(e.key);
        setStoredValues(e.newValue ? JSON.parse(localStorage.getItem(e.key)) : []);
      }
      setFileName('');
      setStoredValues([]);
    };

    // Listener for same-tab updates (triggered by our custom event above)
    const handleLocalUpdate = () => {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const item = localStorage.key(i);
          if (item && item?.startsWith('statement-')) {
            setFileName(item);
            setStoredValues(item ? JSON.parse(localStorage.getItem(item)) : []);
            return;
          }
        }
        setFileName('');
        setStoredValues([]);
      } catch (error) {
        console.error(error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleLocalUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleLocalUpdate);
    };
  }, []);

  return [storedValues, setStoredValues, fileName];
}
