"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CameraOff,
  Flashlight,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ScannerCameraProps {
  onScan: (data: string) => void;
  active?: boolean;
  className?: string;
}

export function ScannerCamera({
  onScan,
  active = true,
  className,
}: ScannerCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoom, setZoom] = useState(1);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      streamRef.current = stream;
      setCameraActive(true);
      setHasPermission(true);

      // Start scanning loop
      scanIntervalRef.current = setInterval(() => {
        scanFrame();
      }, 500);
    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);
      setCameraActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const toggleCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, [stopCamera]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities();
      if ("torch" in capabilities) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as MediaTrackConstraints],
        });
        setTorchEnabled(!torchEnabled);
      }
    } catch (err) {
      console.error("Torch error:", err);
    }
  }, [torchEnabled]);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // In production, use a QR scanning library like jsQR or zxing
    // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // const code = jsQR(imageData.data, imageData.width, imageData.height);
    // if (code) {
    //   onScan(code.data);
    // }
  }, [onScan]);

  useEffect(() => {
    if (active) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [active, startCamera, stopCamera]);

  // Permission denied
  if (hasPermission === false) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-gray-900 rounded-2xl p-8", className)}>
        <CameraOff className="h-16 w-16 text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Camera Access Required
        </h3>
        <p className="text-sm text-gray-400 text-center mb-4">
          Please allow camera access to scan QR codes.
          You may need to update your browser settings.
        </p>
        <Button variant="secondary" onClick={startCamera}>
          <Camera className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-gray-900", className)}>
      {/* Video Feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Scanning Overlay */}
      {cameraActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Semi-transparent border */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Scan window */}
          <div className="relative w-64 h-64">
            {/* Clear center */}
            <div className="absolute inset-0 bg-transparent" />

            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-12 h-12">
              <div className="absolute top-0 left-0 w-full h-1 bg-stellar-500 rounded-full" />
              <div className="absolute top-0 left-0 w-1 h-full bg-stellar-500 rounded-full" />
            </div>
            <div className="absolute top-0 right-0 w-12 h-12">
              <div className="absolute top-0 right-0 w-full h-1 bg-stellar-500 rounded-full" />
              <div className="absolute top-0 right-0 w-1 h-full bg-stellar-500 rounded-full" />
            </div>
            <div className="absolute bottom-0 left-0 w-12 h-12">
              <div className="absolute bottom-0 left-0 w-full h-1 bg-stellar-500 rounded-full" />
              <div className="absolute bottom-0 left-0 w-1 h-full bg-stellar-500 rounded-full" />
            </div>
            <div className="absolute bottom-0 right-0 w-12 h-12">
              <div className="absolute bottom-0 right-0 w-full h-1 bg-stellar-500 rounded-full" />
              <div className="absolute bottom-0 right-0 w-1 h-full bg-stellar-500 rounded-full" />
            </div>

            {/* Scan line */}
            <motion.div
              className="absolute inset-x-2 h-0.5 bg-stellar-500 shadow-lg shadow-stellar-500/50"
              animate={{ y: [0, 256, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
        <Button
          variant="secondary"
          size="icon"
          className="bg-black/50 hover:bg-black/70 border-0 text-white"
          onClick={toggleCamera}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "bg-black/50 hover:bg-black/70 border-0 text-white",
            torchEnabled && "bg-yellow-500/50"
          )}
          onClick={toggleTorch}
        >
          <Flashlight className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="bg-black/50 hover:bg-black/70 border-0 text-white"
          onClick={() => setZoom((z) => Math.min(z + 0.5, 3))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="bg-black/50 hover:bg-black/70 border-0 text-white"
          onClick={() => setZoom((z) => Math.max(z - 0.5, 1))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading State */}
      {!cameraActive && hasPermission === null && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stellar-500 border-t-transparent mx-auto mb-3" />
            <p className="text-sm text-gray-400">Starting camera...</p>
          </div>
        </div>
      )}
    </div>
  );
}
