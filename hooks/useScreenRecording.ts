"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { uploadRecordingVideo } from "@/lib/cheatingUtils";

export interface UseScreenRecordingOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
  onPermissionDenied?: () => void;
  // Chunked upload options
  chunkIntervalMs?: number; // How often to upload chunks (default: 60000ms = 1 minute)
  examId?: string;
  quizId?: string;
}

export interface UseScreenRecordingReturn {
  isRecording: boolean;
  isSupported: boolean;
  permissionDenied: boolean;
  recordingDuration: number;
  chunksUploaded: number;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<void>;
}

export function useScreenRecording({
  enabled = true,
  onError,
  onPermissionDenied,
  chunkIntervalMs = 60000, // 1 minute default
  examId,
  quizId,
}: UseScreenRecordingOptions = {}): UseScreenRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [chunksUploaded, setChunksUploaded] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunkIndexRef = useRef<number>(0);
  const mimeTypeRef = useRef<string>("video/webm");
  const isStartingRef = useRef<boolean>(false); // Guard against concurrent starts

  // Check if browser supports screen capture
  const isSupported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    !!navigator.mediaDevices.getDisplayMedia;

  // Upload current chunks
  const uploadCurrentChunks = useCallback(async () => {
    if (chunksRef.current.length === 0) return;

    const chunksToUpload = [...chunksRef.current];
    chunksRef.current = []; // Clear chunks after copying

    const blob = new Blob(chunksToUpload, { type: mimeTypeRef.current });
    const chunkNumber = chunkIndexRef.current;
    chunkIndexRef.current += 1;

    const chunkDuration = Math.floor(chunkIntervalMs / 1000); // Duration of this chunk in seconds

    console.log(
      `Uploading chunk ${chunkNumber + 1} (${(blob.size / 1024 / 1024).toFixed(
        2
      )} MB)...`
    );

    try {
      await uploadRecordingVideo({
        video: blob,
        videoType: "SCREEN",
        duration: chunkDuration,
        examId,
        quizId,
      });
      setChunksUploaded((prev) => prev + 1);
      console.log(`Chunk ${chunkNumber + 1} uploaded successfully`);
    } catch (err) {
      console.error(`Failed to upload chunk ${chunkNumber + 1}:`, err);
    }
  }, [chunkIntervalMs, examId, quizId]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    mediaRecorderRef.current = null;
  }, []);

  // Start recording
  const startRecording = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent calls
    if (isStartingRef.current || isRecording) {
      console.log("Recording already starting or in progress, skipping");
      return true; // Return true to prevent showing error modal
    }

    if (!enabled || !isSupported) {
      console.warn("Screen recording not enabled or not supported");
      return false;
    }

    if (!examId && !quizId) {
      console.error("Either examId or quizId is required for chunked uploads");
      return false;
    }

    // Set starting flag
    isStartingRef.current = true;

    try {
      // Reset state
      chunksRef.current = [];
      chunkIndexRef.current = 0;
      setPermissionDenied(false);
      setRecordingDuration(0);
      setChunksUploaded(0);

      // Request screen capture permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          frameRate: { ideal: 15, max: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Determine supported MIME type
      let mimeType = "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "video/mp4";
          }
        }
      }
      mimeTypeRef.current = mimeType;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1000000, // 1 Mbps
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available - collect chunks continuously
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle stop
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        // Upload any remaining chunks
        if (chunksRef.current.length > 0) {
          await uploadCurrentChunks();
        }
        cleanup();
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        onError?.(new Error("Recording failed"));
        cleanup();
        setIsRecording(false);
      };

      // Handle track ended (user stopped sharing)
      stream.getVideoTracks()[0].onended = () => {
        console.log("Screen sharing stopped by user");
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      };

      // Start recording - collect data every 5 seconds for smoother chunking
      mediaRecorder.start(5000);
      startTimeRef.current = Date.now();
      setIsRecording(true);

      // Update duration every second
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);

      // Upload chunks every chunkIntervalMs (1 minute by default)
      uploadIntervalRef.current = setInterval(() => {
        uploadCurrentChunks();
      }, chunkIntervalMs);

      console.log(
        `Screen recording started (uploading every ${chunkIntervalMs / 1000}s)`
      );
      isStartingRef.current = false; // Reset starting flag
      return true;
    } catch (error) {
      console.error("Error starting screen recording:", error);

      if (
        error instanceof Error &&
        (error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError")
      ) {
        setPermissionDenied(true);
        onPermissionDenied?.();
      } else {
        onError?.(
          error instanceof Error
            ? error
            : new Error("Failed to start recording")
        );
      }

      cleanup();
      isStartingRef.current = false; // Reset starting flag
      return false;
    }
  }, [
    enabled,
    isSupported,
    isRecording,
    onError,
    onPermissionDenied,
    cleanup,
    chunkIntervalMs,
    examId,
    quizId,
    uploadCurrentChunks,
  ]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<void> => {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== "recording"
    ) {
      return;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        // Upload any remaining chunks
        if (chunksRef.current.length > 0) {
          await uploadCurrentChunks();
        }
        cleanup();
        resolve();
      };

      mediaRecorder.stop();
      console.log("Screen recording stopped");
    });
  }, [cleanup, uploadCurrentChunks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      cleanup();
    };
  }, [cleanup]);

  return {
    isRecording,
    isSupported,
    permissionDenied,
    recordingDuration,
    chunksUploaded,
    startRecording,
    stopRecording,
  };
}
