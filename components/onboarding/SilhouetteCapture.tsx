"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientUserInput } from "@/lib/types";

type PoseLandmark = {
  x: number;
  y: number;
  visibility?: number;
};

type PoseLandmarkerHandle = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => { landmarks?: PoseLandmark[][] };
  close: () => void;
};

type SilhouetteCaptureProps = {
  onBack: () => void;
  onComplete: (capture: Pick<ClientUserInput, "silhouettePng" | "webcamStatus">) => void;
};

type CameraState = "idle" | "loading" | "ready" | "capturing" | "denied" | "captured";

export function SilhouetteCapture({ onBack, onComplete }: SilhouetteCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarkerHandle | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [silhouettePng, setSilhouettePng] = useState<string | undefined>();
  const [captureError, setCaptureError] = useState<string | null>(null);

  const stopLoop = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    return () => {
      stopLoop();
      stopCamera();
      poseLandmarkerRef.current?.close();
    };
  }, [stopLoop]);

  const runDrawLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const landmarker = poseLandmarkerRef.current;

    if (video && canvas && ctx && landmarker && video.readyState >= 2) {
      const w = video.videoWidth || 720;
      const h = video.videoHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);
      const result = landmarker.detectForVideo(video, performance.now());
      const lms = result.landmarks?.[0];
      if (lms) drawLiveOutline(ctx, lms, w, h);
    }

    animFrameRef.current = requestAnimationFrame(runDrawLoop);
  }, []);

  async function startCamera() {
    setCameraState("loading");
    setCaptureError(null);
    try {
      poseLandmarkerRef.current = await createPoseLandmarker();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 720, height: 720 },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("ready");
      animFrameRef.current = requestAnimationFrame(runDrawLoop);
    } catch {
      stopCamera();
      setCameraState("denied");
    }
  }

  async function captureSilhouette() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = poseLandmarkerRef.current;
    if (!video || !canvas || !landmarker) return;

    setCameraState("capturing");
    setCaptureError(null);
    stopLoop();

    const w = video.videoWidth || 720;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const result = landmarker.detectForVideo(video, performance.now());
    const lms = result.landmarks?.[0];

    if (!lms) {
      setCaptureError("Step back so your full body is visible, then try again.");
      setCameraState("ready");
      animFrameRef.current = requestAnimationFrame(runDrawLoop);
      return;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    drawCapturedSilhouette(ctx, lms, w, h);

    setSilhouettePng(canvas.toDataURL("image/png"));
    setCameraState("captured");
    stopCamera();
  }

  const isLive = cameraState === "ready" || cameraState === "loading" || cameraState === "capturing";

  return (
    <section className="surface p-5 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--mint)]">Silhouette</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">Optional camera signal.</h2>
          <p className="mt-4 text-slate-600">
            The app captures one abstract pose-based silhouette frame. No raw webcam frame is sent, and no face is drawn.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Camera denied or not available? You can continue with measurements only.
          </p>
        </div>

        <div>
          <div className="relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-950">
            {isLive ? (
              <>
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full scale-x-[-1] object-cover opacity-20"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
              </>
            ) : silhouettePng ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={silhouettePng} alt="Captured silhouette" className="h-full w-full object-contain" />
                <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
              </>
            ) : (
              <>
                <div className="grid h-full place-items-center p-8 text-center">
                  <div>
                    <div className="mx-auto h-28 w-20 rounded-t-full bg-slate-800" />
                    <div className="mx-auto mt-2 h-32 w-32 rounded-t-[48px] bg-slate-800" />
                    <p className="mt-4 text-sm text-slate-500">Enable camera to see your silhouette</p>
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
              </>
            )}
          </div>

          {cameraState === "denied" ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Camera access was not available. The match will continue from your typed inputs.
            </p>
          ) : null}
          {captureError ? <p className="mt-3 text-sm font-semibold text-red-700">{captureError}</p> : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button type="button" className="rounded-md border border-slate-300 px-5 py-3 font-bold" onClick={onBack}>
              Back
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              {(cameraState === "idle" || cameraState === "denied") && (
                <button type="button" className="rounded-md border border-slate-300 px-5 py-3 font-bold" onClick={startCamera}>
                  Use camera
                </button>
              )}
              {(cameraState === "ready" || cameraState === "capturing") && (
                <button
                  type="button"
                  disabled={cameraState === "capturing"}
                  className="rounded-md bg-[var(--blue)] px-5 py-3 font-bold text-white disabled:bg-slate-300"
                  onClick={captureSilhouette}
                >
                  {cameraState === "capturing" ? "Capturing..." : "Capture"}
                </button>
              )}
              <button
                type="button"
                className="rounded-md bg-[var(--navy)] px-5 py-3 font-bold text-white"
                onClick={() =>
                  onComplete({
                    silhouettePng,
                    webcamStatus: silhouettePng ? "granted" : cameraState === "denied" ? "denied" : "skipped"
                  })
                }
              >
                Match archetype
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function createPoseLandmarker(): Promise<PoseLandmarkerHandle> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
  );
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numPoses: 1
  });
}

// Returns a landmark's canvas position with x flipped to match the mirrored video
function pt(lms: PoseLandmark[], i: number, w: number, h: number, minVis = 0.35) {
  const lm = lms[i];
  if (!lm || (lm.visibility ?? 1) < minVis) return null;
  return { x: (1 - lm.x) * w, y: lm.y * h };
}

function estimateHeadRadius(lms: PoseLandmark[], w: number, h: number): { cx: number; cy: number; r: number } | null {
  const nose = pt(lms, 0, w, h, 0.2);
  if (!nose) return null;
  const lEar = pt(lms, 7, w, h, 0.2);
  const rEar = pt(lms, 8, w, h, 0.2);
  const r =
    lEar && rEar
      ? Math.hypot(lEar.x - rEar.x, lEar.y - rEar.y) * 0.55
      : w * 0.07;
  return { cx: nose.x, cy: nose.y - r * 0.25, r };
}

// Live overlay: glowing white outline strokes on transparent background
function drawLiveOutline(ctx: CanvasRenderingContext2D, lms: PoseLandmark[], w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = Math.max(5, w * 0.013);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(160, 255, 210, 0.65)";
  ctx.shadowBlur = 16;

  const head = estimateHeadRadius(lms, w, h);
  if (head) {
    ctx.beginPath();
    ctx.arc(head.cx, head.cy, head.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const connections: [number, number][] = [
    [11, 12], // across shoulders
    [11, 23], [12, 24], // torso sides
    [23, 24], // across hips
    [11, 13], [13, 15], // left arm
    [12, 14], [14, 16], // right arm
    [23, 25], [25, 27], // left leg
    [24, 26], [26, 28], // right leg
  ];

  for (const [a, b] of connections) {
    const pa = pt(lms, a, w, h);
    const pb = pt(lms, b, w, h);
    if (!pa || !pb) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }

  ctx.restore();
}

// Captured silhouette: dark filled shapes on white background
function drawCapturedSilhouette(ctx: CanvasRenderingContext2D, lms: PoseLandmark[], w: number, h: number) {
  ctx.save();
  ctx.fillStyle = "#0a1628";
  ctx.strokeStyle = "#0a1628";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const g = (i: number) => pt(lms, i, w, h);

  // Head
  const head = estimateHeadRadius(lms, w, h);
  if (head) {
    ctx.beginPath();
    ctx.arc(head.cx, head.cy, head.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Torso as filled quadrilateral
  const ls = g(11), rs = g(12), lh = g(23), rh = g(24);
  if (ls && rs && lh && rh) {
    ctx.beginPath();
    ctx.moveTo(ls.x, ls.y);
    ctx.lineTo(rs.x, rs.y);
    ctx.lineTo(rh.x, rh.y);
    ctx.lineTo(lh.x, lh.y);
    ctx.closePath();
    ctx.fill();
  }

  // Limbs as thick rounded strokes (round caps create capsule-shaped segments)
  ctx.lineWidth = Math.max(18, w * 0.042);
  const limbs: [number, number][] = [
    [11, 13], [13, 15],
    [12, 14], [14, 16],
    [23, 25], [25, 27],
    [24, 26], [26, 28],
  ];
  for (const [a, b] of limbs) {
    const pa = g(a), pb = g(b);
    if (!pa || !pb) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }

  ctx.restore();
}
