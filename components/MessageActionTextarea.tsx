import { useEffect, useRef, useState } from "react";
import { Monitor, MonitorOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageActionTextareaProps {
  onSubmit: (message: string, image?: File) => void;
  className?: string;
  disabled?: boolean;
}

const MAX_WIDTH = 1024;

export const MessageActionTextarea = ({
  onSubmit,
  className,
  disabled = false,
}: MessageActionTextareaProps) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const continuousIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearContinuousTimer = () => {
    if (continuousIntervalRef.current) {
      clearInterval(continuousIntervalRef.current);
      continuousIntervalRef.current = null;
    }
  };

  const stopContinuousSharing = () => {
    clearContinuousTimer();
    setIsContinuousMode(false);
  };

  const canvasToFile = async (
    canvas: HTMLCanvasElement,
    filename: string
  ): Promise<File | null> => {
    const targetCanvas = (() => {
      if (canvas.width <= MAX_WIDTH) return canvas;
      const scale = MAX_WIDTH / canvas.width;
      const scaled = document.createElement("canvas");
      scaled.width = Math.round(canvas.width * scale);
      scaled.height = Math.round(canvas.height * scale);
      const scaledCtx = scaled.getContext("2d");
      if (!scaledCtx) {
        return canvas;
      }
      scaledCtx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
      return scaled;
    })();

    return new Promise((resolve) => {
      targetCanvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          resolve(
            new File([blob], filename, {
              type: blob.type || "image/jpeg",
            })
          );
        },
        "image/jpeg",
        0.75
      );
    });
  };

  const captureScreenFrame = async (): Promise<File | null> => {
    const stream = screenStreamRef.current;
    if (!stream) return null;

    const [track] = stream.getVideoTracks();
    if (!track) return null;

    // Try ImageCapture API first
    try {
      const ImageCapture = (window as any).ImageCapture;
      if (ImageCapture) {
        const imageCapture = new ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(bitmap, 0, 0);
        return await canvasToFile(canvas, `screenshot-${Date.now()}.jpg`);
      }
    } catch (err) {
      console.warn("ImageCapture failed, falling back to video element", err);
    }

    // Fallback to drawing a frame from a cloned video track
    const clone = track.clone();
    const tempStream = new MediaStream([clone]);
    const video = document.createElement("video");
    video.srcObject = tempStream;
    video.muted = true;

    const ready = new Promise<void>((resolve) => {
      const handleLoadedData = () => {
        video.removeEventListener("loadeddata", handleLoadedData);
        resolve();
      };
      video.addEventListener("loadeddata", handleLoadedData, { once: true });
    });

    await video.play().catch(() => undefined);
    await ready;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      tempStream.getTracks().forEach((t) => t.stop());
      return null;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    tempStream.getTracks().forEach((t) => t.stop());

    return await canvasToFile(canvas, `screenshot-${Date.now()}.jpg`);
  };

  const stopScreenShare = () => {
    stopContinuousSharing();
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
  };

  const shareScreen = async () => {
    if (disabled) return;

    if (!navigator?.mediaDevices?.getDisplayMedia) {
      window.alert("Screen sharing isn't supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          stopScreenShare();
        });
      });

      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      startContinuousSharing({ immediate: true });
    } catch (err) {
      console.error("Screen share error:", err);
      window.alert("Screen share required for sending snapshots.");
    }
  };

  const sendSnapshot = async () => {
    if (disabled) return;

    const file = await captureScreenFrame();
    if (file) {
      onSubmit("", file);
    }
  };

  const startContinuousSharing = (options?: { immediate?: boolean }) => {
    if (disabled) return;
    if (!screenStreamRef.current) return;

    setIsContinuousMode(true);
    clearContinuousTimer();

    const send = async () => {
      await sendSnapshot();
    };

    if (options?.immediate) {
      void send();
    }

    continuousIntervalRef.current = setInterval(() => {
      void send();
    }, 3000);
  };

  useEffect(() => {
    if (disabled && isContinuousMode) {
      stopContinuousSharing();
    }
  }, [disabled, isContinuousMode]);

  useEffect(() => {
    return () => {
      stopContinuousSharing();
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
    };
  }, []);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={isScreenSharing ? stopScreenShare : shareScreen}
          disabled={disabled}
        >
          {isScreenSharing ? (
            <>
              <MonitorOff className="mr-2 h-4 w-4" /> Stop sharing
            </>
          ) : (
            <>
              <Monitor className="mr-2 h-4 w-4" /> Share screen
            </>
          )}
        </Button>

      </div>
    </div>
  );
};
