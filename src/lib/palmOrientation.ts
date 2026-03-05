/**
 * Palm orientation detection utilities.
 *
 * Determines whether the user is showing the palm or the back of their hand
 * based on MediaPipe hand landmarks. Used by the ring clipping-plane system
 * to decide which half of the ring model to render.
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Vector3 } from "three";

export type PalmSide = "Palm" | "Back";

/**
 * Determine whether the detected hand is showing its palm or its back.
 *
 * Uses the cross-product of (wrist→indexMCP) × (wrist→pinkyMCP) to compute
 * a surface normal. The sign of the Z component (screen-space depth direction)
 * differs between left and right hands due to mirroring, letting us classify
 * the orientation.
 *
 * @param landmarks  21 MediaPipe normalized hand landmarks.
 * @param handedness "Left" or "Right" as reported by MediaPipe.
 * @returns "Palm" if the palm faces the camera, "Back" otherwise.
 */
export function getPalmOrientation(
    landmarks: NormalizedLandmark[],
    handedness: string,
): PalmSide {
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];

    // Vectors in normalized landmark space
    const v1x = indexMcp.x - wrist.x;
    const v1y = indexMcp.y - wrist.y;
    const v2x = pinkyMcp.x - wrist.x;
    const v2y = pinkyMcp.y - wrist.y;

    // Z component of cross product (v1 × v2)
    const normalZ = v1x * v2y - v1y * v2x;

    // For a left hand facing palm-forward (in mirrored video), normalZ > 0.
    // For a right hand facing palm-forward, normalZ < 0.
    const isPalm = handedness === "Left" ? normalZ > 0 : normalZ < 0;
    return isPalm ? "Palm" : "Back";
}

/**
 * Compute the palm normal in pixel-coordinate space.
 *
 * The normal is derived from the cross product of (wrist→indexMCP) × (wrist→pinkyMCP)
 * using the same coordinate mapping as JewelryModel (x = lm.x*w, y = (1-lm.y)*h, z = lm.z*w).
 * The result is negated so it points outward from the back of the hand (knuckle side).
 *
 * @param landmarks  21 MediaPipe normalized hand landmarks.
 * @param w  Video pixel width.
 * @param h  Video pixel height.
 * @returns Unit-length normal vector in pixel-coordinate space.
 */
export function getPalmNormalWorld(
    landmarks: NormalizedLandmark[],
    w: number,
    h: number,
): Vector3 {
    const wrist = new Vector3(landmarks[0].x * w, (1 - landmarks[0].y) * h, landmarks[0].z * w);
    const indexMcp = new Vector3(landmarks[5].x * w, (1 - landmarks[5].y) * h, landmarks[5].z * w);
    const pinkyMcp = new Vector3(landmarks[17].x * w, (1 - landmarks[17].y) * h, landmarks[17].z * w);

    const wristToIndex = new Vector3().subVectors(indexMcp, wrist);
    const wristToPinky = new Vector3().subVectors(pinkyMcp, wrist);

    const normal = new Vector3().crossVectors(wristToIndex, wristToPinky);
    const len = normal.length();
    if (len < 1e-8) return new Vector3(0, 0, 1);
    normal.divideScalar(len);
    normal.negate(); // Point out of the back of the hand

    return normal;
}
