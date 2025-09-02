"use client";
import React from "react";
import ListeningUI from "./VoiceWave";

interface VoiceOverlayProps {
  isListening: boolean;
  onStop: () => void;
  transcript?: string;
}

export default function VoiceOverlay({ isListening, onStop, transcript = "" }: VoiceOverlayProps) {
  if (!isListening) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-lg">
      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
        {/* Voice wave animation */}
        <div className="flex items-center justify-center mb-8">
          <div 
            className="relative rounded-full p-8 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(255, 177, 33, 0.2), rgba(255, 81, 70, 0.2))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-gradient-to-r from-green-600 to-green-900"></div>
            <div className="absolute inset-2 rounded-full animate-ping opacity-15 bg-gradient-to-r from-red-400 to-green-600" style={{ animationDelay: "0.5s" }}></div>
            
            {/* Microphone icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center relative z-10">
              <svg
                width="32"
                height="32"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M12 16a4 4 0 0 0 4-4V7a4 4 0 0 0-8 0v5a4 4 0 0 0 4 4zm5-4a1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V21a1 1 0 1 1-2 0v-2.08A7 7 0 0 1 5 12a1 1 0 1 1 2 0 5 5 0 0 0 10 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Listening...
          </h2>
          
          {/* Real-time transcript display */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 min-h-[100px]">
            {transcript ? (
              <p className="text-white text-lg leading-relaxed">
                {transcript}
                <span className="inline-block w-0.5 h-6 bg-green-600 ml-1 animate-pulse" />
              </p>
            ) : (
              <p className="text-white/60 text-lg italic">
                Start speaking...
              </p>
            )}
          </div>
        </div>

        {/* Stop button */}
        <button
          onClick={onStop}
          className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg
            width="20"
            height="20"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          <span className="font-medium">Stop</span>
        </button>
      </div>
    </div>
  );
}
