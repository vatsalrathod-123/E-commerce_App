// Pure placement maths for the live try-on feature (no React, no DOM),
// so it can be unit-tested and tweaked in one place.
//
// MediaPipe pose landmarks used:
//   11 = user's left shoulder, 12 = user's right shoulder
// Landmark x/y are normalised (0..1) on the RAW (un-mirrored) camera frame.
// We show a mirrored preview, so x is flipped: x' = (1 - x) * width.
// After flipping, landmark 11 is on the screen-left and 12 on the screen-right.

export const SIZE_SCALE = { S: 0.92, M: 1, L: 1.08, XL: 1.16, XXL: 1.24 };

// Garment width relative to shoulder-joint width (covers sleeves + ease).
export const BASE_WIDTH_FACTOR = 1.75;
// Fraction of garment height that sits ABOVE the shoulder line (collar rise).
export const COLLAR_RISE = 0.1;

const MIN_VISIBILITY = 0.5;
// Ignore detections where the shoulders span less than this share of the frame
// width (user is too far away / pose is junk).
const MIN_SHOULDER_SPAN = 0.06;
const MAX_ANGLE = Math.PI / 3; // clamp wild rotations to +/-60deg

/**
 * @returns {{cx:number, cy:number, angle:number, width:number} | null}
 *   null when the shoulders aren't reliably visible.
 */
export function computeTransform(
  landmarks,
  W,
  H,
  { sizeScale = 1, fit = 1 } = {},
) {
  if (!landmarks) return null;
  const l = landmarks[11];
  const r = landmarks[12];
  if (!l || !r) return null;
  if (
    (l.visibility ?? 1) < MIN_VISIBILITY ||
    (r.visibility ?? 1) < MIN_VISIBILITY
  ) {
    return null;
  }

  // mirrored screen coordinates: a = screen-left shoulder, b = screen-right
  const ax = (1 - l.x) * W;
  const ay = l.y * H;
  const bx = (1 - r.x) * W;
  const by = r.y * H;

  const shoulderW = Math.hypot(bx - ax, by - ay);
  if (shoulderW < W * MIN_SHOULDER_SPAN) return null;

  const angle = Math.max(
    -MAX_ANGLE,
    Math.min(MAX_ANGLE, Math.atan2(by - ay, bx - ax)),
  );

  return {
    cx: (ax + bx) / 2,
    cy: (ay + by) / 2,
    angle,
    width: shoulderW * BASE_WIDTH_FACTOR * sizeScale * fit,
  };
}

/** Exponential moving average to stop the garment jittering. */
export function smoothTransform(prev, next, alpha = 0.35) {
  if (!prev) return next;
  const mix = (a, b) => a + (b - a) * alpha;
  return {
    cx: mix(prev.cx, next.cx),
    cy: mix(prev.cy, next.cy),
    angle: mix(prev.angle, next.angle),
    width: mix(prev.width, next.width),
  };
}

/**
 * Draw the garment on a 2D context.
 * @param offsetY  vertical nudge as a fraction of garment height (+ = down)
 */
export function drawGarment(ctx, img, t, offsetY = 0) {
  const height = t.width * (img.naturalHeight / img.naturalWidth);
  ctx.save();
  ctx.translate(t.cx, t.cy);
  ctx.rotate(t.angle);
  ctx.drawImage(
    img,
    -t.width / 2,
    -height * COLLAR_RISE + offsetY * height,
    t.width,
    height,
  );
  ctx.restore();
}
