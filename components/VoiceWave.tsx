"use client";
import React, { useState, useEffect, useRef } from "react";

interface AIMessageProps {
  text: string;
  isStreaming?: boolean;
  displayedText?: string;
}

export default function AIMessage({ text, isStreaming = false, displayedText = "" }: AIMessageProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<string[]>([]);

  // Check if speech synthesis is supported
  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window);
  }, []);

  // Prepare words array when text changes
  useEffect(() => {
    if (text) {
      wordsRef.current = text.split(' ');
    }
  }, [text]);

  const startSpeaking = () => {
    if (!speechSupported || !text || isSpeaking) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure voice settings
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Find a good voice (prefer female voices for friendlier tone)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Ava'))
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Track word highlighting
    let wordIndex = 0;
    const words = text.split(' ');
    
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setCurrentWordIndex(wordIndex);
        wordIndex++;
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
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentWordIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
  };

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
    setCurrentWordIndex(-1);
  };

  const renderTextWithHighlight = (textToRender: string) => {
    const words = textToRender.split(' ');
    return (
      <span>
        {words.map((word, index) => (
          <span
            key={index}
            className={`${
              isSpeaking && currentWordIndex === index
                ? 'bg-orange-200 text-orange-800 rounded px-1'
                : ''
            } transition-all duration-150`}
          >
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="bg-[rgba(34,34,34,0.9)] text-white rounded-2xl px-5 py-3 border border-[#007437]/20">
      {/* Message content */}
      <div className="mb-3">
        <p className="text-sm md:text-base leading-relaxed">
          {isStreaming 
            ? `${displayedText}${displayedText ? "|" : ""}`
            : renderTextWithHighlight(text)
          }
        </p>
      </div>

      {/* Speech controls - only show when not streaming */}
      {!isStreaming && speechSupported && text && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
          {!isSpeaking ? (
            <button
              onClick={startSpeaking}
              className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-full"
              title="Read aloud"
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <span>Play</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {!isPaused ? (
                <button
                  onClick={pauseSpeaking}
                  className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-full"
                  title="Pause"
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={resumeSpeaking}
                  className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-full"
                  title="Resume"
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>Resume</span>
                </button>
              )}
              <button
                onClick={stopSpeaking}
                className="flex items-center gap-2 text-xs text-gray-300 hover:text-red-300 transition-colors bg-gray-700 hover:bg-red-600 px-3 py-1.5 rounded-full"
                title="Stop"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
                <span>Stop</span>
              </button>
            </div>
          )}
          
          {/* Speaking indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-2 text-xs text-orange-400">
              <div className="flex gap-1">
                <div className="w-1 h-3 bg-orange-400 rounded animate-pulse"></div>
                <div className="w-1 h-3 bg-orange-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-3 bg-orange-400 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span>Speaking...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}