
"use client";
import React from "react";
import ListeningUI from "./VoiceWave";

interface VoiceOverlayProps {
  isListening: boolean;
  onStop: () => void;
}

export default function VoiceOverlay({ isListening, onStop }: VoiceOverlayProps) {
  if (!isListening) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-orange-100/80 via-pink-50/80 to-yellow-50/80 backdrop-blur-lg">
      {/* Animated background waves */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute w-full h-full opacity-30"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 177, 33, 0.3)" />
              <stop offset="50%" stopColor="rgba(255, 192, 203, 0.3)" />
              <stop offset="100%" stopColor="rgba(255, 255, 0, 0.3)" />
            </linearGradient>
            <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 220, 177, 0.2)" />
              <stop offset="50%" stopColor="rgba(255, 200, 220, 0.2)" />
              <stop offset="100%" stopColor="rgba(255, 255, 180, 0.2)" />
            </linearGradient>
          </defs>
          <path
            d="M0,60 Q25,20 50,60 T100,60 L100,100 L0,100 Z"
            fill="url(#waveGradient1)"
            className="animate-pulse"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0;5,0;0,0"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M0,70 Q25,30 50,70 T100,70 L100,100 L0,100 Z"
            fill="url(#waveGradient2)"
            className="animate-pulse"
            style={{ animationDelay: "0.8s" }}
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0;-3,0;0,0"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent mb-6">
            Listening...
          </h2>
          <p className="text-xl text-gray-700 font-medium">
            Speak now, I&apos;m listening to your question
          </p>
        </div>

        {/* Voice wave animation with enhanced styling */}
        <div className="flex items-center justify-center mb-12">
          <div 
            className="relative rounded-full p-12 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(255, 177, 33, 0.3), rgba(255, 192, 203, 0.3), rgba(255, 255, 0, 0.3))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.3)"
            }}
          >
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-gradient-to-r from-orange-400 to-pink-400"></div>
            <div className="absolute inset-2 rounded-full animate-ping opacity-20 bg-gradient-to-r from-pink-400 to-yellow-400" style={{ animationDelay: "0.5s" }}></div>
            
            <ListeningUI isListening={isListening} className="w-40 h-20 relative z-10" />
          </div>
        </div>

        {/* Stop button with enhanced styling */}
        <button
          onClick={onStop}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-10 py-4 rounded-full transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          <span className="text-lg font-semibold">Stop Listening</span>
        </button>
      </div>
    </div>
  );
}