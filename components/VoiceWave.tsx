"use client";
import React, { useEffect, useRef } from "react";

interface ListeningUIProps {
  isListening: boolean;
  onSilence?: () => void;
  onCancel?: () => void;
  onMicClick?: () => void;
  className?: string;
}

export default function ListeningUI({
  isListening,
  onSilence,
  onCancel,
  onMicClick,
  className = "",
}: ListeningUIProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    let animationFrame: number;
    let silenceCount = 0;

    async function start() {
      if (!isListening) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
        sourceRef.current = source;

        function draw() {
          if (!analyserRef.current || !dataArrayRef.current || !canvasRef.current) return;
          analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d")!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw waveform
          ctx.save();
          ctx.beginPath();
          ctx.lineWidth = 2;
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, "#FFB31F");
          grad.addColorStop(0.5, "#FF6F61");
          grad.addColorStop(1, "#FFB31F");
          ctx.strokeStyle = grad;

          const sliceWidth = canvas.width / dataArrayRef.current.length;
          let x = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            const v = dataArrayRef.current[i] / 128.0;
            const y = (v * canvas.height) / 2;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          ctx.stroke();
          ctx.restore();

          // Silence detection
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            const v = dataArrayRef.current[i] - 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / dataArrayRef.current.length);
          if (rms < 2) {
            silenceCount++;
            if (silenceCount > 15) {
              if (onSilence) onSilence();
            }
          } else {
            silenceCount = 0;
          }

          animationFrame = requestAnimationFrame(draw);
        }
        draw();
      } catch (err) {
        // fallback: static waveform
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d")!;
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }

    if (isListening) {
      start();
    } else {
      // Clean up
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isListening, onSilence]);

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen bg-[#fafafa] ${className}`}
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Waveform */}
      <canvas
        ref={canvasRef}
        width={900}
        height={250}
        style={{ maxWidth: "90vw", maxHeight: 250, marginBottom: 40 }}
      />
      {/* Listening text */}
      <div
        style={{
          color: "#FF7F32",
          fontWeight: 700,
          fontSize: 28,
          marginBottom: 40,
        }}
      >
        Listening...
      </div>
      {/* Buttons */}
      <div className="flex gap-10">
        {/* Microphone Button */}
        <button
          onClick={onMicClick}
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FFB31F 0%, #FF6F61 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            boxShadow: "0 4px 24px #FFB31F44",
            cursor: "pointer",
          }}
        >
          <svg width="32" height="32" fill="#fff" viewBox="0 0 24 24">
            <path d="M12 16a4 4 0 0 0 4-4V7a4 4 0 0 0-8 0v5a4 4 0 0 0 4 4zm5-4a1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V21a1 1 0 1 1-2 0v-2.08A7 7 0 0 1 5 12a1 1 0 1 1 2 0 5 5 0 0 0 10 0z" />
          </svg>
        </button>
        {/* Cancel Button */}
        <button
          onClick={onCancel}
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FFB31F 0%, #FF6F61 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            boxShadow: "0 4px 24px #FFB31F44",
            cursor: "pointer",
          }}
        >
          <svg width="32" height="32" fill="#fff" viewBox="0 0 24 24">
            <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

