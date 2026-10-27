import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  SIZE_SCALE,
  computeTransform,
  smoothTransform,
  drawGarment,
} from "../utils/tryOnMath";

// Keep this version identical to "@mediapipe/tasks-vision" in package.json,
// otherwise the WASM files and the JS bundle won't match.
const MEDIAPIPE_VERSION = "1.1.1";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

// Frames to keep showing the last garment position after tracking is lost,
// so brief detection drops don't make the garment flicker.
const GRACE_FRAMES = 8;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // needed so the screenshot canvas isn't tainted
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load garment image"));
    img.src = src;
  });

const cameraErrorMessage = (err) => {
  if (!navigator.mediaDevices?.getUserMedia) {
    return "Camera is not available. Open this site over HTTPS in a modern browser.";
  }
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera permission was denied. Allow camera access in your browser and try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device.";
    case "NotReadableError":
      return "Your camera is being used by another app.";
    default:
      return err?.message || "Could not start the camera.";
  }
};

const TryOn = ({ product, initialSize, onAddToCart, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Slider values are read inside the render loop, so keep them in refs
  // (state changes would otherwise restart the whole effect).
  const sizeRef = useRef(initialSize || product.sizes?.[0] || "M");
  const fitRef = useRef(1);
  const offsetRef = useRef(0);

  const [size, setSize] = useState(sizeRef.current);
  const [fit, setFit] = useState(1);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);
  useEffect(() => {
    fitRef.current = fit;
  }, [fit]);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    let cancelled = false;
    let stream = null;
    let landmarker = null;
    let rafId = 0;
    let phase = "camera"; // which stage failed decides the error message

    const start = async () => {
      try {
        // 1. camera (do this first so the permission prompt appears right away)
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("no mediaDevices");
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) return;

        const video = videoRef.current;
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        await video.play();
        if (cancelled) return;

        // 2. garment image + pose model (loaded lazily, not in the main bundle)
        phase = "model";
        const [garment, vision] = await Promise.all([
          loadImage(product.tryOnImage),
          import("@mediapipe/tasks-vision"),
        ]);
        if (cancelled) return;

        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
        const options = {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "VIDEO",
          numPoses: 1,
        };
        try {
          landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
            ...options,
            baseOptions: { ...options.baseOptions, delegate: "GPU" },
          });
        } catch {
          // Some devices have no usable WebGL/GPU delegate - fall back to CPU.
          landmarker = await vision.PoseLandmarker.createFromOptions(
            fileset,
            options,
          );
        }
        if (cancelled) {
          landmarker.close();
          return;
        }

        setStatus("ready");

        // 3. render loop
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let lastVideoTime = -1;
        let smoothed = null;
        let lostFrames = GRACE_FRAMES + 1;
        let lastTracking = false;

        const render = () => {
          if (cancelled) return;
          rafId = requestAnimationFrame(render);

          if (video.readyState < 2 || !video.videoWidth) return;
          const W = video.videoWidth;
          const H = video.videoHeight;
          if (canvas.width !== W || canvas.height !== H) {
            canvas.width = W;
            canvas.height = H;
          }

          // Only run pose detection when there's a new video frame.
          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const result = landmarker.detectForVideo(video, performance.now());
            const next = computeTransform(result.landmarks?.[0], W, H, {
              sizeScale: SIZE_SCALE[sizeRef.current] ?? 1,
              fit: fitRef.current,
            });
            if (next) {
              smoothed = smoothTransform(smoothed, next);
              lostFrames = 0;
            } else {
              lostFrames += 1;
              if (lostFrames > GRACE_FRAMES) smoothed = null;
            }
          }

          // mirrored camera frame
          ctx.save();
          ctx.translate(W, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, W, H);
          ctx.restore();

          const isTracking = !!smoothed && lostFrames <= GRACE_FRAMES;
          if (isTracking)
            drawGarment(ctx, garment, smoothed, offsetRef.current);

          if (isTracking !== lastTracking) {
            lastTracking = isTracking;
            setTracking(isTracking);
          }
        };
        rafId = requestAnimationFrame(render);
      } catch (err) {
        console.error("Try-on error:", err);
        if (cancelled) return;
        setError(
          phase === "camera"
            ? cameraErrorMessage(err)
            : "Could not load the try-on tracker. Check your internet connection and try again.",
        );
        setStatus("error");
      }
    };

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
      landmarker?.close();
    };
  }, [product.tryOnImage]);

  // Close on Escape + lock page scroll while the modal is open
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const capture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob((blob) => {
        if (!blob) return toast.error("Could not capture the photo");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `try-on-${product.name.replace(/\s+/g, "-").toLowerCase()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch {
      toast.error("Screenshot isn't available for this product image");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl max-h-[95vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Live try-on"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <p className="font-medium text-sm sm:text-base">
            Live try-on · {product.name}
          </p>
          <button
            onClick={onClose}
            className="text-lg leading-none cursor-pointer"
            aria-label="Close try-on"
          >
            ✕
          </button>
        </div>

        {/* Camera view */}
        <div className="relative bg-black flex items-center justify-center min-h-[16rem]">
          {/* Visually hidden (not display:none, which can stall decoding on
              iOS Safari). The canvas draws the mirrored frames from it. */}
          <video
            ref={videoRef}
            className="absolute w-px h-px opacity-0 pointer-events-none"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className={`w-full max-h-[65vh] object-contain ${
              status === "ready" ? "" : "invisible absolute"
            }`}
          />

          {status === "loading" && (
            <p className="text-white text-sm px-6 text-center">
              Starting camera and loading the body tracker…
              <br />
              <span className="text-gray-400 text-xs">
                The first load can take a few seconds.
              </span>
            </p>
          )}

          {status === "error" && (
            <p className="text-white text-sm px-6 py-10 text-center max-w-md">
              {error}
            </p>
          )}

          {status === "ready" && !tracking && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center px-3 pointer-events-none">
              <p className="bg-black/70 text-white text-xs sm:text-sm px-3 py-2 text-center">
                Stand back so your head and shoulders are in frame and face the
                camera.
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        {status === "ready" && (
          <div className="px-4 py-4 flex flex-col gap-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-gray-600 mr-1">Try size:</p>
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`border py-1.5 px-3.5 bg-gray-100 cursor-pointer ${
                    s === size ? "border-orange-500" : "border-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-gray-600">
                Fit adjust
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.01"
                  value={fit}
                  onChange={(e) => setFit(Number(e.target.value))}
                />
              </label>
              <label className="flex flex-col gap-1 text-gray-600">
                Move up / down
                <input
                  type="range"
                  min="-0.2"
                  max="0.2"
                  step="0.005"
                  value={offset}
                  onChange={(e) => setOffset(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={capture}
                className="border border-black px-6 py-2.5 cursor-pointer"
              >
                TAKE PHOTO
              </button>
              <button
                onClick={() => {
                  onAddToCart(size);
                  onClose();
                }}
                className="bg-black text-white px-6 py-2.5 active:bg-gray-700 cursor-pointer"
              >
                ADD TO CART ({size})
              </button>
            </div>

            <p className="text-xs text-gray-400">
              This is a 2D preview to help you visualise the style. Real fit and
              fabric drape may differ. Your camera video stays on your device
              and is never uploaded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TryOn;
