export const LOGICAL_WIDTH = 1920;
export const LOGICAL_HEIGHT = 1080;
export const PPTX_WIDTH_IN = 13.333333;
export const PPTX_HEIGHT_IN = 7.5;
export const HIGH_QUALITY_SCALE = 2;

export const pxToIn = (value) => value / 144;
export const ptToLogicalPx = (value) => value * 2;

export function normalizeBox(box) {
  return {
    x: Number(box.x),
    y: Number(box.y),
    w: Number(box.w),
    h: Number(box.h),
  };
}

export function boxToPptx(box) {
  const value = normalizeBox(box);
  return {
    x: pxToIn(value.x),
    y: pxToIn(value.y),
    w: pxToIn(value.w),
    h: pxToIn(value.h),
  };
}

export function intersectionArea(a, b) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

export function isInsideCanvas(box) {
  const value = normalizeBox(box);
  return (
    value.x >= 0 &&
    value.y >= 0 &&
    value.w >= 0 &&
    value.h >= 0 &&
    (value.w > 0 || value.h > 0) &&
    value.x + value.w <= LOGICAL_WIDTH &&
    value.y + value.h <= LOGICAL_HEIGHT
  );
}
