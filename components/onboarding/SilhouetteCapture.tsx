"use client";

import { useEffect, useRef, useState } from "react";
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
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [silhouettePng, setSilhouettePng] = useState<string | undefined>();
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
      poseLandmarkerRef.current?.close();
    };
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
    } catch {
      stopCamera();
      setCameraState("denied");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function captureSilhouette() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const poseLandmarker = poseLandmarkerRef.current;
    if (!video || !canvas || !context || !poseLandmarker) {
      return;
    }

    setCameraState("capturing");
    setCaptureError(null);

    const width = video.videoWidth || 720;
    const height = video.videoHeight || 720;
    const result = poseLandmarker.detectForVideo(video, performance.now());
    const landmarks = result.landmarks?.[0];

    if (!landmarks) {
      setCaptureError("Step back so your upper body is visible, then try the capture again.");
      setCameraState("ready");
      return;
    }

    canvas.width = width;
    canvas.height = height;
    drawAbstractSilhouette(context, landmarks, width, height);

    const png = canvas.toDataURL("image/png");
    setSilhouettePng(png);
    setCameraState("captured");
    stopCamera();
  }

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
          <div className="aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            {cameraState === "ready" || cameraState === "loading" || cameraState === "capturing" ? (
              <video ref={videoRef} className="h-full w-full scale-x-[-1] object-cover" muted playsInline />
            ) : silhouettePng ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={silhouettePng} alt="Captured abstract silhouette" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center p-8 text-center text-slate-500">
                <div>
                  <div className="mx-auto h-28 w-20 rounded-t-full bg-slate-300" />
                  <div className="mx-auto mt-2 h-32 w-32 rounded-t-[48px] bg-slate-300" />
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
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
              {cameraState === "idle" || cameraState === "denied" ? (
                <button type="button" className="rounded-md border border-slate-300 px-5 py-3 font-bold" onClick={startCamera}>
                  Use camera
                </button>
              ) : null}
              {cameraState === "ready" || cameraState === "capturing" ? (
                <button
                  type="button"
                  disabled={cameraState === "capturing"}
                  className="rounded-md bg-[var(--blue)] px-5 py-3 font-bold text-white disabled:bg-slate-300"
                  onClick={captureSilhouette}
                >
                  {cameraState === "capturing" ? "Capturing..." : "Capture"}
                </button>
              ) : null}
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

function drawAbstractSilhouette(
  context: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number
) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.lineCap = "round";
  context.lineJoin = "round";

  const point = (index: number) => {
    const landmark = landmarks[index];
    if (!landmark || (landmark.visibility ?? 1) < 0.35) {
      return null;
    }

    return {
      x: (1 - landmark.x) * width,
      y: landmark.y * height
    };
  };

  const leftShoulder = point(11);
  const rightShoulder = point(12);
  const leftHip = point(23);
  const rightHip = point(24);

  context.strokeStyle = "#0a0a0a";
  context.fillStyle = "#0a0a0a";

  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    context.beginPath();
    context.moveTo(leftShoulder.x, leftShoulder.y);
    context.lineTo(rightShoulder.x, rightShoulder.y);
    context.lineTo(rightHip.x, rightHip.y);
    context.lineTo(leftHip.x, leftHip.y);
    context.closePath();
    context.fill();
  }

  drawLimb(context, point(11), point(13), point(15), width);
  drawLimb(context, point(12), point(14), point(16), width);
  drawLimb(context, point(23), point(25), point(27), width);
  drawLimb(context, point(24), point(26), point(28), width);

  for (const index of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
    const current = point(index);
    if (!current) {
      continue;
    }
    context.beginPath();
    context.arc(current.x, current.y, Math.max(7, width * 0.012), 0, Math.PI * 2);
    context.fill();
  }
}

function drawLimb(
  context: CanvasRenderingContext2D,
  start: { x: number; y: number } | null,
  middle: { x: number; y: number } | null,
  end: { x: number; y: number } | null,
  width: number
) {
  if (!start || !middle || !end) {
    return;
  }

  context.lineWidth = Math.max(14, width * 0.035);
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(middle.x, middle.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}
