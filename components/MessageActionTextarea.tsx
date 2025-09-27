import type { FormEvent } from "react";
import { useState, useRef, useEffect } from "react";
import {
  Image,
  X,
  Monitor,
  MonitorOff,
  Play,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageActionTextareaProps {
  onSubmit: (message: string, image?: File) => void;
  className?: string;
  textAreaClassName?: string;
  disabled?: boolean;
}

export const MessageActionTextarea = ({
  onSubmit,
  className,
  textAreaClassName,
  disabled = false,
  ...props
}: MessageActionTextareaProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const continuousIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup screen sharing on unmount
  useEffect(() => {
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const message = formData.get("message") as string;

    if (message.trim() || selectedImage || (isScreenSharing && !isContinuousMode)) {
      let imageToSend = selectedImage;

      // Auto-capture screenshot if screen sharing is active and not in continuous mode
      if (isScreenSharing && !isContinuousMode && !selectedImage) {
        const screenshot = await captureScreenFrame();
        if (screenshot) {
          // Convert base64 data URL to File object
          const response = await fetch(screenshot);
          const blob = await response.blob();
          imageToSend = new File([blob], 'screenshot.jpg', { type: 'image/jpeg' });
        }
      }

      onSubmit?.(message, imageToSend || undefined);
      handleReset();
    }
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    formRef.current?.reset();
    handleRemoveImage();
  };

  // Capture one frame as base64 data url
  const captureScreenFrame = async (): Promise<string | null> => {
    const screen = screenStreamRef.current;
    if (!screen) return null;
    const track = screen.getVideoTracks()[0];
    try {
      // @ts-ignore ImageCapture may not be in lib dom types
      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap as CanvasImageSource, 0, 0);
      // resize to reduce payload
      const MAX_W = 1024;
      if (canvas.width > MAX_W) {
        const scale = MAX_W / canvas.width;
        const tmp = document.createElement("canvas");
        tmp.width = Math.round(canvas.width * scale);
        tmp.height = Math.round(canvas.height * scale);
        tmp.getContext("2d")!.drawImage(canvas, 0, 0, tmp.width, tmp.height);
        return tmp.toDataURL("image/jpeg", 0.75);
      }
      return canvas.toDataURL("image/jpeg", 0.75);
    } catch (err) {
      // fallback: draw from a video element
      const video = document.createElement("video");
      video.srcObject = new MediaStream([track]);
      await video.play().catch(() => {});
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      video.pause();
      (video.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
      // resize and compress
      const MAX_W = 1024;
      if (canvas.width > MAX_W) {
        const scale = MAX_W / canvas.width;
        const tmp = document.createElement("canvas");
        tmp.width = Math.round(canvas.width * scale);
        tmp.height = Math.round(canvas.height * scale);
        tmp.getContext("2d")!.drawImage(canvas, 0, 0, tmp.width, tmp.height);
        return tmp.toDataURL("image/jpeg", 0.75);
      }
      return canvas.toDataURL("image/jpeg", 0.75);
    }
  };

  // Share screen (store locally so we can snapshot)
  const shareScreen = async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screen;
      setIsScreenSharing(true);
    } catch (err) {
      console.error("Screen share error:", err);
      alert("Screen share required for sending snapshots.");
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    stopContinuousSharing();
  };

  const startContinuousSharing = () => {
    if (!isScreenSharing) return;

    setIsContinuousMode(true);
    // Send screenshot every 3 seconds
    continuousIntervalRef.current = setInterval(async () => {
      const screenshot = await captureScreenFrame();
      if (screenshot) {
        const response = await fetch(screenshot);
        const blob = await response.blob();
        const imageFile = new File([blob], 'continuous-screenshot.jpg', { type: 'image/jpeg' });
        onSubmit?.('', imageFile);
      }
    }, 3000);
  };

  const stopContinuousSharing = () => {
    setIsContinuousMode(false);
    if (continuousIntervalRef.current) {
      clearInterval(continuousIntervalRef.current);
      continuousIntervalRef.current = null;
    }
  };

  const toggleContinuousMode = () => {
    if (isContinuousMode) {
      stopContinuousSharing();
    } else {
      startContinuousSharing();
    }
  };

  return (
    <form
      ref={formRef}
      className={cn("relative flex h-max items-center gap-3", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <textarea
        aria-label="Message"
        placeholder={isContinuousMode ? "Continuous screen sharing active..." : "Type your message..."}
        name="message"
        className={cn(
          "h-18 w-full resize-none p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
          isContinuousMode ? "opacity-50" : "",
          textAreaClassName
        )}
        disabled={disabled || isContinuousMode}
        rows={3}
      />

      {selectedImage && imagePreview && (
        <div className="absolute left-3 bottom-14 flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
          <img
            src={imagePreview}
            alt="Selected image"
            className="w-8 h-8 object-cover rounded"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="absolute right-3.5 bottom-2 flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleImageSelect}
            disabled={disabled}
            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title="Select image"
          >
            <Image size={16} />
          </button>

          <button
            type="button"
            onClick={isScreenSharing ? stopScreenShare : shareScreen}
            disabled={disabled}
            className={cn(
              "p-1 disabled:opacity-50",
              isScreenSharing
                ? "text-red-500 hover:text-red-700"
                : "text-gray-500 hover:text-gray-700"
            )}
            title={isScreenSharing ? "Stop screen sharing" : "Share screen"}
          >
            {isScreenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
          </button>

          {isScreenSharing && (
            <button
              type="button"
              onClick={toggleContinuousMode}
              disabled={disabled}
              className={cn(
                "p-1 disabled:opacity-50",
                isContinuousMode
                  ? "text-green-500 hover:text-green-700"
                  : "text-gray-500 hover:text-gray-700"
              )}
              title={isContinuousMode ? "Stop continuous sharing" : "Start continuous sharing"}
            >
              {isContinuousMode ? <Square size={16} /> : <Play size={16} />}
            </button>
          )}
        </div>

        <Button size="sm" type="submit" disabled={disabled || isContinuousMode}>
          Send
        </Button>
      </div>
    </form>
  );
};
