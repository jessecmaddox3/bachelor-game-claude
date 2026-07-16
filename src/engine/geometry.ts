export interface Box {
  x: number; // inches from page left
  y: number; // inches from page top
  w: number;
  h: number;
}

export const PT_PER_IN = 72;

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
