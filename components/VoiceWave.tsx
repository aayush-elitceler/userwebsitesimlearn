"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";

interface AIMessageProps {
  text: string;
}

export default function AIMessage({ text }: AIMessageProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const wordsRef = useRef<string[]>([]);

  // Check for browser speech synthesis support
  useEffect(() => {
    setSpeechSupported("speechSynthesis" in window);
  }, []);

  // Split text into words for highlighting
  useEffect(() => {
    if (text) {
      wordsRef.current = text.split(" ");
    }
  }, [text]);

  const startSpeaking = useCallback(() => {
    if (!speechSupported || !text || isSpeaking) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        (voice) =>
          voice.lang.startsWith("en") &&
          (voice.name.includes("Female") ||
            voice.name.includes("Samantha") ||
            voice.name.includes("Ava"))
      ) || voices.find((voice) => voice.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Optional: highlight words during speech
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        const words = wordsRef.current;
        let count = 0;
        for (let i = 0; i < words.length; i++) {
          count += words[i].length + 1; // +1 for space
          if (count > charIndex) {
            setCurrentWordIndex(i);
            break;
          }
        }
      }
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentWordIndex(0);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
      setShowMessage(true); // Show message after speech ends
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
  }, [speechSupported, text, isSpeaking]);

  // Auto-start speaking once text is available and supported
  useEffect(() => {
    if (text && speechSupported && !isSpeaking) {
      const timer = setTimeout(() => {
        startSpeaking();
      }, 300); // slight delay to ensure text is rendered

      return () => clearTimeout(timer);
    }
  }, [text, speechSupported, isSpeaking, startSpeaking]);

  const pauseSpeaking = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setShowMessage(true);
    setCurrentWordIndex(-1);
  };

  const renderTextWithHighlight = (textToRender: string) => {
    const words = textToRender.split(" ");
    return (
      <span>
        {words.map((word, index) => (
          <span
            key={index}
            className={`${
              isSpeaking && currentWordIndex === index
                ? "bg-orange-200 text-orange-800 rounded px-1"
                : ""
            } transition-all duration-150`}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="bg-[rgba(34,34,34,0.9)] text-white rounded-2xl px-5 py-3 border border-[#007437]/20">
      {/* Message content */}
      {showMessage && (
        <div className="mb-3">
          <p className="text-sm md:text-base leading-relaxed">
            {renderTextWithHighlight(text)}
          </p>
        </div>
      )}

      {/* Speech controls */}
      {speechSupported && text && isSpeaking && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
          <div className="flex items-center gap-2">
            {!isPaused ? (
              <button
                onClick={pauseSpeaking}
                className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-full"
                title="Pause"
              >
                <svg
                  width="14"
                  height="14"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={resumeSpeaking}
                className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-full"
                title="Resume"
              >
                <svg
                  width="14"
                  height="14"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Resume</span>
              </button>
            )}
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-2 text-xs text-gray-300 hover:text-red-300 transition-colors bg-gray-700 hover:bg-red-600 px-3 py-1.5 rounded-full"
              title="Stop"
            >
              <svg
                width="14"
                height="14"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 6h12v12H6z" />
              </svg>
              <span>Stop</span>
            </button>
          </div>

          {/* Speaking indicator */}
          <div className="flex items-center gap-2 text-xs text-orange-400">
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-orange-400 rounded animate-pulse"></div>
              <div
                className="w-1 h-3 bg-orange-400 rounded animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-1 h-3 bg-orange-400 rounded animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <span>Speaking...</span>
          </div>
        </div>
      )}
    </div>
  );
}
