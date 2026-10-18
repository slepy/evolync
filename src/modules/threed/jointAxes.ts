import * as THREE from "three";
import type { Quat, Vec3 } from "./types/data";

export type Axis = "x" | "y" | "z";
export const AXES: Axis[] = ["x", "y", "z"];

/** Rotate sliders run from −180° to +180°, centered on the rest pose (D8 joint panel). */
export const ROTATE_RANGE_DEG = 180;
/** Move sliders (hips only) run ±0.5 m around the rest position. */
export const MOVE_RANGE_M = 0.5;

const IDENTITY: Quat = { x: 0, y: 0, z: 0, w: 1 };
const toDeg = (rad: number) => (rad * 180) / Math.PI;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** XYZ Euler angles in degrees of a joint's rotation (identity when unset). */
export function quatToEulerDeg(q: Quat | undefined): Vec3 {
  const { x, y, z, w } = q ?? IDENTITY;
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(x, y, z, w), "XYZ");
  // `+ 0` turns −0 into 0.
  return { x: toDeg(e.x) + 0, y: toDeg(e.y) + 0, z: toDeg(e.z) + 0 };
}

export function eulerDegToQuat(e: Vec3): Quat {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(toRad(e.x), toRad(e.y), toRad(e.z), "XYZ"));
  return { x: q.x, y: q.y, z: q.z, w: q.w };
}

/** The rotation with one axis set to `deg`, the other two kept. */
export function withAxisDeg(q: Quat | undefined, axis: Axis, deg: number): Quat {
  return eulerDegToQuat({ ...quatToEulerDeg(q), [axis]: deg });
}

/** Position of a 0..1 slider fraction for `value` in −range..+range. */
export const sliderFraction = (value: number, range: number): number =>
  Math.min(1, Math.max(0, (value + range) / (2 * range)));

export const clampToRange = (value: number, range: number): number => Math.min(range, Math.max(-range, value));

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

/** "+24°", "−8°", "0°" (rounded, real minus sign). */
export const formatDeg = (deg: number): string => `${signed(Math.round(deg))}°`;

/** "+12 cm", "−4 cm", "0 cm" for a move in meters. */
export const formatCm = (m: number): string => `${signed(Math.round(m * 100))} cm`;
