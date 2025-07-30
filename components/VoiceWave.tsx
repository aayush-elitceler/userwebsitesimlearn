
"use client";
import React, { useEffect, useState } from "react";

interface VoiceWaveProps {
  isListening: boolean;
  className?: string;
}

export default function VoiceWave({ isListening, className = "" }: VoiceWaveProps) {
  const [waveHeights, setWaveHeights] = useState<number[]>(new Array(7).fill(10));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isListening) {
      interval = setInterval(() => {
        setWaveHeights(prev => 
          prev.map((_, index) => {
            const baseHeight = 15;
            const maxHeight = index === 3 ? 70 : index === 2 || index === 4 ? 60 : 45; // Center bars taller
            return baseHeight + Math.random() * (maxHeight - baseHeight);
          })
        );
      }, 120); 
    } else {
      setWaveHeights(new Array(7).fill(10));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {waveHeights.map((height, index) => (
        <div
          key={index}
          className="bg-white rounded-full transition-all duration-100 ease-in-out"
          style={{
            width: '3px',
            height: `${height}px`,
            opacity: isListening ? 1 : 0.4,
            transform: isListening ? 'scaleY(1)' : 'scaleY(0.3)',
          }}
        />
      ))}
    </div>
  );
}