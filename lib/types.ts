export interface MonthPoint {
  value: number;
  isActual: boolean;
  budget: number;
}

export interface Vendor {
  name: string;
  cat: string;
  gl: string;
  owner: string;
  method: string;
  baseline: number;
  growth: number;
  variance: 'over' | 'good' | 'flat';
}

export interface VendorSeries extends Vendor {
  series: MonthPoint[];
}

/** keyed by vendorName → monthIdx → override value */
export type OverridesMap = Record<string, Record<number, number>>;

export interface Tweaks {
  density: 'compact' | 'regular' | 'comfy';
  varianceColor: boolean;
  showAnnotations: boolean;
  timeUnit: 'monthly' | 'quarterly';
}

export interface OverridesContextValue {
  overrides: OverridesMap;
  setOverride: (vendorName: string, monthIdx: number, value: number) => void;
}

export interface TweaksContextValue {
  tweaks: Tweaks;
  setTweaks: (patch: Partial<Tweaks>) => void;
}
