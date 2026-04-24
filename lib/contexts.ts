import { createContext, useContext } from 'react';
import type { OverridesContextValue, TweaksContextValue } from './types';

export const OverridesContext = createContext<OverridesContextValue>({
  overrides: {},
  setOverride: () => {},
});

export const TweaksContext = createContext<TweaksContextValue>({
  tweaks: {
    density: 'regular',
    varianceColor: true,
    showAnnotations: true,
    timeUnit: 'monthly',
  },
  setTweaks: () => {},
});

export function useOverrides(): OverridesContextValue {
  return useContext(OverridesContext);
}

export function useTweaks(): TweaksContextValue {
  return useContext(TweaksContext);
}
