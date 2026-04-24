'use client';

import { useState, useEffect } from 'react';
import type { OverridesMap } from './types';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStored(JSON.parse(item));
    } catch {
      // ignore parse errors
    }
  }, [key]);

  const setValue = (value: T) => {
    setStored(value);
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage errors
    }
  };

  return [stored, setValue];
}

export function saveOverride(overrides: OverridesMap, vendorName: string, monthIdx: number, value: number): OverridesMap {
  return {
    ...overrides,
    [vendorName]: {
      ...(overrides[vendorName] ?? {}),
      [monthIdx]: value,
    },
  };
}
