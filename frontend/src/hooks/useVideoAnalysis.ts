/**
 * useVideoAnalysis — Real-time MediaPipe Face Landmarker hook.
 *
 * Initialises a FaceLandmarker from the bundled model at /models/face_landmarker.task,
 * runs detectForVideo() in a requestAnimationFrame loop while active, and accumulates
 * per-frame metrics (eye contact, blink, smile, head pose, confidence).
 *
 * Matches the metric computation from the Kaggle experiment exactly.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

import type { HeadPoseMetrics, VisionMetrics } from "@/types/interview";

// ---------------------------------------------------------------------------
// Constants (mirror Kaggle thresholds)
// ---------------------------------------------------------------------------

const BLINK_THRESHOLD = 0.55;
const HEAD_YAW_THRESHOLD = 15;
const HEAD_PITCH_THRESHOLD = 15;
const LIVE_UPDATE_EVERY_N_FRAMES = 15; // update live metrics every N frames

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Convert a 4×4 row-major transformation matrix (Float32Array) to
 * XYZ intrinsic Euler angles in degrees (matches scipy's as_euler("xyz")).
 *
 * Layout:
 *   [ m0  m1  m2  m3  ]    row 0
 *   [ m4  m5  m6  m7  ]    row 1
 *   [ m8  m9  m10 m11 ]    row 2
 *   [ m12 m13 m14 m15 ]    row 3
 */
function matrixToEulerXYZ(m: ArrayLike<number>): {
  pitch: number;
  yaw: number;
  roll: number;
} {
  const TO_DEG = 180 / Math.PI;
  // r02 = m[2], r12 = m[6], r22 = m[10], r01 = m[1], r00 = m[0]
  const yaw = Math.asin(Math.max(-1, Math.min(1, m[2]))) * TO_DEG;
  const pitch = Math.atan2(-m[6], m[10]) * TO_DEG;
  const roll = Math.atan2(-m[1], m[0]) * TO_DEG;
  return { pitch, yaw, roll };
}

function buildDefaultVision(): VisionMetrics {
  return {
    duration_seconds: 0,
    face_presence_percent: 0,
    eye_contact_percent: 0,
    attention_percent: 0,
    blink_rate_per_minute: 0,
    smile_score_percent: 0,
    confidence: 0,
    head_pose: {
      yaw_mean: 0,
      pitch_mean: 0,
      roll_mean: 0,
      yaw_std: 0,
      pitch_std: 0,
      roll_std: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Accumulator type
// ---------------------------------------------------------------------------

interface FrameAccumulator {
  frames: number;
  faceFrames: number;
  eyeContactFrames: number;
  blinkCount: number;
  smileSum: number;
  yawList: number[];
  pitchList: number[];
  rollList: number[];
  startTime: number; // performance.now()
}

function freshAccumulator(): FrameAccumulator {
  return {
    frames: 0,
    faceFrames: 0,
    eyeContactFrames: 0,
    blinkCount: 0,
    smileSum: 0,
    yawList: [],
    pitchList: [],
    rollList: [],
    startTime: performance.now(),
  };
}

function accumulatorToMetrics(acc: FrameAccumulator): VisionMetrics {
  const duration = (performance.now() - acc.startTime) / 1000;
  const facePresence = acc.frames > 0 ? (acc.faceFrames / acc.frames) * 100 : 0;
  const eyeContact = acc.frames > 0 ? (acc.eyeContactFrames / acc.frames) * 100 : 0;
  const avgSmile = acc.faceFrames > 0 ? (acc.smileSum / acc.faceFrames) * 100 : 0;
  const yawStd = std(acc.yawList);
  const headPoseStability = Math.max(0, 100 - yawStd * 3);
  const blinkRate = duration > 0 ? acc.blinkCount / (duration / 60) : 0;
  const attention = eyeContact * 0.6 + facePresence * 0.4;
  const confidence = Math.min(
    100,
    eyeContact * 0.35 +
      attention * 0.25 +
      headPoseStability * 0.2 +
      Math.min(blinkRate, 20) / 20 * 100 * 0.1 +
      avgSmile * 0.1
  );

  const hp: HeadPoseMetrics = {
    yaw_mean: Math.round(mean(acc.yawList) * 10) / 10,
    pitch_mean: Math.round(mean(acc.pitchList) * 10) / 10,
    roll_mean: Math.round(mean(acc.rollList) * 10) / 10,
    yaw_std: Math.round(yawStd * 10) / 10,
    pitch_std: Math.round(std(acc.pitchList) * 10) / 10,
    roll_std: Math.round(std(acc.rollList) * 10) / 10,
  };

  return {
    duration_seconds: Math.round(duration * 10) / 10,
    face_presence_percent: Math.round(facePresence * 10) / 10,
    eye_contact_percent: Math.round(eyeContact * 10) / 10,
    attention_percent: Math.round(attention * 10) / 10,
    blink_rate_per_minute: Math.round(blinkRate * 10) / 10,
    smile_score_percent: Math.round(avgSmile * 10) / 10,
    confidence: Math.round(confidence * 10) / 10,
    head_pose: hp,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseVideoAnalysisOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /**
   * Optional RefObject pointing to an already-open MediaStream.
   * Passing a RefObject (not .current) lets startCapture() always read the
   * latest stream value — avoids stale-null from first-render snapshot.
   */
  externalStream?: React.RefObject<MediaStream | null> | null;
}

export interface UseVideoAnalysisReturn {
  /** True once FaceLandmarker is loaded and ready. */
  isInitialized: boolean;
  /** True while the capture loop is running. */
  isActive: boolean;
  /** Live metrics updated every LIVE_UPDATE_EVERY_N_FRAMES frames. */
  liveMetrics: VisionMetrics;
  /** Start camera + detection loop. */
  startCapture: () => Promise<void>;
  /** Stop loop and return the accumulated metrics for this window. */
  stopCapture: () => VisionMetrics;
  /** Error message if initialization or camera access fails. */
  error: string | null;
}

export function useVideoAnalysis({
  videoRef,
  externalStream,
}: UseVideoAnalysisOptions): UseVideoAnalysisReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<VisionMetrics>(buildDefaultVision());
  const [error, setError] = useState<string | null>(null);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const isActiveRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const accRef = useRef<FrameAccumulator>(freshAccumulator());
  const streamRef = useRef<MediaStream | null>(null);

  // ── Initialize FaceLandmarker on mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const lm = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) {
          faceLandmarkerRef.current = lm;
          setIsInitialized(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[useVideoAnalysis] MediaPipe init failed:", err);
          setError("Failed to load face detection model.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Per-frame processing ─────────────────────────────────────────────────
  const processFrame = useCallback(() => {
    if (!isActiveRef.current) return;
    const lm = faceLandmarkerRef.current;
    const video = videoRef.current;
    if (!lm || !video || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const result: FaceLandmarkerResult = lm.detectForVideo(video, performance.now());
    const acc = accRef.current;
    acc.frames++;

    if (result.faceLandmarks.length > 0) {
      acc.faceFrames++;

      // Blendshapes
      const shapes: Record<string, number> = {};
      if (result.faceBlendshapes.length > 0) {
        for (const cat of result.faceBlendshapes[0].categories) {
          shapes[cat.categoryName] = cat.score;
        }
      }

      // Blink
      const leftBlink = shapes["eyeBlinkLeft"] ?? 0;
      const rightBlink = shapes["eyeBlinkRight"] ?? 0;
      if ((leftBlink + rightBlink) / 2 > BLINK_THRESHOLD) {
        acc.blinkCount++;
      }

      // Smile
      const smile =
        ((shapes["mouthSmileLeft"] ?? 0) + (shapes["mouthSmileRight"] ?? 0)) / 2;
      acc.smileSum += smile;

      // Head pose + eye contact
      if (result.facialTransformationMatrixes.length > 0) {
        const { pitch, yaw, roll } = matrixToEulerXYZ(
          result.facialTransformationMatrixes[0].data
        );
        acc.pitchList.push(pitch);
        acc.yawList.push(yaw);
        acc.rollList.push(roll);

        if (
          Math.abs(yaw) < HEAD_YAW_THRESHOLD &&
          Math.abs(pitch) < HEAD_PITCH_THRESHOLD
        ) {
          acc.eyeContactFrames++;
        }
      }

      // Live metrics update
      if (acc.frames % LIVE_UPDATE_EVERY_N_FRAMES === 0) {
        setLiveMetrics(accumulatorToMetrics(acc));
      }
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [videoRef]);

  // ── startCapture ─────────────────────────────────────────────────────────
  const startCapture = useCallback(async () => {
    if (!faceLandmarkerRef.current) {
      setError("Face detection model is not ready yet.");
      return;
    }
    if (!videoRef.current) return;

    // Dereference at call-time — the stream may have arrived after first render
    const stream = externalStream?.current ?? null;

    if (stream) {
      // Reuse the external stream — don't open a new camera
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Already playing — ignore
        }
      }
    } else {
      // No external stream — request camera ourselves
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        streamRef.current = newStream;
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      } catch (err) {
        console.error("[useVideoAnalysis] Camera access denied:", err);
        setError("Camera access denied. Please allow camera permissions.");
        return;
      }
    }

    // Reset accumulator
    accRef.current = freshAccumulator();
    setLiveMetrics(buildDefaultVision());

    isActiveRef.current = true;
    setIsActive(true);
    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [videoRef, externalStream, processFrame]);

  // ── stopCapture ──────────────────────────────────────────────────────────
  const stopCapture = useCallback((): VisionMetrics => {
    isActiveRef.current = false;
    setIsActive(false);

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Only stop tracks if WE own the stream (not an external RefObject stream)
    const hasExternal = !!(externalStream?.current);
    if (!hasExternal && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (!hasExternal && videoRef.current) {
      videoRef.current.srcObject = null;
    }

    const metrics = accumulatorToMetrics(accRef.current);
    setLiveMetrics(metrics);
    return metrics;
  }, [videoRef, externalStream]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { isInitialized, isActive, liveMetrics, startCapture, stopCapture, error };
}
