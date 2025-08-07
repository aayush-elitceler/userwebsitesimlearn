// components/SpruceBall.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";

export default function SpruceBall({ listening }: { listening: boolean }) {
  const [volume, setVolume] = useState(0);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let mic: MediaStreamAudioSourceNode | null = null;
    let rafId: number;
    
    // For pulse animation
    let pulseTime = 0;
    const pulseSpeed = 0.05;

    const updateVolume = () => {
      if (!analyser) return;

      const data = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const normalized = (data[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / data.length);
      setVolume(rms); // ~0 to 1
      
      // Update pulse for subtle animation
      pulseTime += pulseSpeed;
      setPulse(Math.sin(pulseTime) * 0.1);

      rafId = requestAnimationFrame(updateVolume);
    };

    if (listening) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          audioContext = new AudioContext();
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          mic = audioContext.createMediaStreamSource(stream);
          mic.connect(analyser);
          updateVolume();
        })
        .catch((err) => {
          console.error("Mic error:", err);
        });
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (mic) mic.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext) audioContext.close();
    };
  }, [listening]);

  // Calculate smooth transitions
  const scale = 1 + volume * 0.5 + pulse * 0.2;
  const glow = 0.5 + volume * 1.2;
  
  // Colors for different states
  const baseColors = listening
    ? "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(100, 200, 255, 0.9), rgba(0, 120, 255, 0.9), rgba(0, 80, 200, 1))"
    : "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 204, 128, 0.9), rgba(255, 112, 67, 0.9), rgba(255, 87, 34, 1))";

  return (
    <div className="flex justify-center items-center py-10">
      <div
        className="rounded-full w-40 h-40 transition-all duration-150 ease-out flex items-center justify-center relative"
        style={{
          transform: `scale(${scale})`,
          background: baseColors,
          boxShadow: `
            0 0 40px rgba(0, 150, 255, ${glow}),
            0 0 80px rgba(0, 100, 255, ${glow * 0.5})
          `,
        }}
      >
        {/* No text inside the circle */}
      </div>
    </div>
  );
}
