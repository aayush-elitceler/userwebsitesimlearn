// components/SpruceBall.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";

export default function SpruceBall({ listening }: { listening: boolean }) {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let mic: MediaStreamAudioSourceNode | null = null;
    let rafId: number;

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

  const scale = 1 + volume * 0.4;
  const glow = 0.4 + volume * 1.5;

  return (
    <div className="flex justify-center items-center py-10">
      <div
        className="rounded-full w-40 h-40 transition-all duration-75"
        style={{
          transform: `scale(${scale})`,
          background: `
            radial-gradient(circle at 30% 30%, 
              rgba(255, 255, 255, 0.9),
              rgba(255, 204, 128, 0.9),
              rgba(255, 112, 67, 0.9),
              rgba(255, 87, 34, 1)
            )
          `,
          boxShadow: `
            0 0 40px rgba(255, 145, 0, ${glow}),
            0 0 80px rgba(255, 87, 34, ${glow * 0.5})
          `,
          animation: "float 5s ease-in-out infinite",
        }}
      />
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px) scale(${scale});
          }
          50% {
            transform: translateY(-4px) scale(${scale * 1.01});
          }
          100% {
            transform: translateY(0px) scale(${scale});
          }
        }
      `}</style>
    </div>
  );
}
