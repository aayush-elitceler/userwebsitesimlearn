'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDownIcon, MonitorIcon, MicIcon, StopCircleIcon, SendIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import AIMessage from '@/components/VoiceWave';
import SpruceBall from '@/components/SpruceBall';

// Google AI Studio style grades and personas
const grades = [
  '1st grade', '2nd grade', '3rd grade', '4th grade', '5th grade', '6th grade',
  '7th grade', '8th grade', '9th grade', '10th grade', '11th grade', '12th grade',
  'UG', 'PG',
];

const styles = [
  { label: 'Professor', value: 'professor' },
  { label: 'Friend', value: 'friend' },
];

export default function ScreenRecorderWithAI() {
  const { state } = useSidebar();
  
  // Basic settings
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [autoSendEnabled, setAutoSendEnabled] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Screen Recording
  const [isRecording, setIsRecording] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Speech Recognition
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestTranscriptRef = useRef<{final: string, interim: string}>({final: '', interim: ''});
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  
  // Chat and AI
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string; timestamp: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio management
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Video size management (2MB limit)
  const MAX_VIDEO_SIZE = 2 * 1024 * 1024; // 2MB
  const [currentVideoSize, setCurrentVideoSize] = useState(0);

  // === START: New Onboarding Code ===
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1); // 1: class selection, 2: persona selection

  useEffect(() => {
    // Always show onboarding on page refresh, regardless of cookie
    setShowOnboarding(true);
  }, []);

  useEffect(() => {
    if (showOnboarding) {
      if (onboardingStep === 1) {
        // First step: wait for user to select class
        if (selectedGrade) {
          // User has selected class, move to persona selection after a short delay
          const timer = setTimeout(() => {
            setOnboardingStep(2);
          }, 1000);
          return () => clearTimeout(timer);
        }
      } else if (onboardingStep === 2) {
        // Second step: wait for user to select persona
        if (selectedStyle) {
          // User has selected persona, hide onboarding after a short delay
          const timer = setTimeout(() => {
            setShowOnboarding(false);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [showOnboarding, onboardingStep, selectedGrade, selectedStyle]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false; // Stop after a single utterance or silence
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
      };

      // Event listener for when speech ends (silence detected)
      recognitionRef.current.onspeechend = () => {
        console.log('🔇 Silence detected. Recognition will end.');
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        // Clear existing silence timer and countdown when we get new speech
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setSilenceCountdown(null);

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(interimTranscript);
        if (finalTranscript) {
          setFinalTranscript(prev => {
            const newFinal = prev + finalTranscript;
            latestTranscriptRef.current.final = newFinal;
            return newFinal;
          });
        }
        
        // Update the ref with current transcripts
        latestTranscriptRef.current.interim = interimTranscript;

        // Start patience timer (2 seconds for comfortable speaking) - only if auto-send is enabled and not processing
        if (autoSendEnabled && !isProcessing) {
          setSilenceCountdown(2);
          
          // Update countdown every second
          let currentCount = 2;
          countdownTimerRef.current = setInterval(() => {
            currentCount--;
            setSilenceCountdown(currentCount);
            
            if (currentCount <= 0) {
              if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
                countdownTimerRef.current = null;
              }
            }
          }, 1000);
          
          silenceTimerRef.current = setTimeout(() => {
            console.log('🔇 Detected 3 seconds of silence, processing speech...');
            
            // Clear countdown
            setSilenceCountdown(null);
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            
            // Get current transcript from ref
            const currentTranscript = (latestTranscriptRef.current.final + ' ' + latestTranscriptRef.current.interim).trim();
            console.log('Current transcript for processing:', currentTranscript);
            
            if (currentTranscript && isRecording && !isProcessing) {
              // Stop recognition first
              if (recognitionRef.current && isListening) {
                try {
                  recognitionRef.current.stop();
                } catch (err) {
                  console.log('Stop recognition error (ignored):', err);
                }
              }
              setIsListening(false);
              
              // Process the speech
              setTimeout(() => {
                handleProcessSpeech();
              }, 300);
            }
          }, 1000);
        }
        // End of onresult handler
      };

      recognitionRef.current.onend = () => {
        console.log('🔇 Speech recognition ended');
        setIsListening(false);
        
        // Clear silence timer and countdown since recognition ended
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setSilenceCountdown(null);
        
        // Check if we have transcript content to process (only auto-process if auto-send is enabled)
        const currentTranscript = (latestTranscriptRef.current.final + ' ' + latestTranscriptRef.current.interim).trim();
        
        if (currentTranscript && isRecording && !isProcessing && selectedGrade && selectedStyle && autoSendEnabled) {
          console.log('🚀 Processing transcript on recognition end:', currentTranscript);
          // Process the accumulated transcript
          setTimeout(() => {
            handleProcessSpeech();
          }, 500);
        } else if (isRecording && !isProcessing && !currentTranscript && autoSendEnabled) {
          // Only restart if we don't have pending transcript and we're still recording and auto-send is on
          console.log('🔄 Auto-restarting speech recognition (no transcript)...');
          setTimeout(() => restartSpeechRecognition(), 1000);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('🔇 Speech recognition error:', event.error);
        setIsListening(false);
        
        // Clear silence timer and countdown on error
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setSilenceCountdown(null);
        
        // Handle different error types (only restart if auto-send is enabled)
        if (event.error === 'no-speech') {
          console.log('🔄 No speech detected, restarting...');
          setTimeout(() => {
            if (isRecording && !isProcessing && autoSendEnabled) {
              restartSpeechRecognition();
            }
          }, 1000);
        } else if (event.error === 'network' || event.error === 'audio-capture' || event.error === 'aborted') {
          console.log('🔄 Restarting after recoverable error...');
          setTimeout(() => {
            if (isRecording && !isProcessing && autoSendEnabled) {
              restartSpeechRecognition();
            }
          }, 1500);
        } else {
          console.log('❌ Speech recognition stopped due to unrecoverable error:', event.error);
        }
      };
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [finalTranscript, transcript, isRecording, isProcessing]);

  // Start screen recording
  const startScreenRecording = async () => {
    try {
      setError(null);
      console.log('🎥 Starting Screen Recording...');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false // Disable audio capture to prevent capturing AI speech
      });

      setScreenStream(stream);
      setIsRecording(true);

      setupMediaRecorder(stream);
      startSpeechRecognition();

      console.log('✅ Screen Recording Active');
    } catch (err: any) {
      console.error('❌ Failed to start screen recording:', err);
      setError('Failed to access screen. Please check permissions.');
    }
  };

  // Setup media recorder with 2MB management
  const setupMediaRecorder = (stream: MediaStream) => {
    console.log('🎥 Setting up media recorder...');
    recordedChunksRef.current = [];
    setCurrentVideoSize(0);
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        console.log('📹 Video chunk received:', event.data.size, 'bytes');
        
        // Check if adding this chunk would exceed 2MB
        const newSize = currentVideoSize + event.data.size;
        
        if (newSize > MAX_VIDEO_SIZE) {
          console.log('⚠️ Video size would exceed 2MB, removing old chunks');
          // Remove oldest chunks until we can fit the new one
          let removedSize = 0;
          while (recordedChunksRef.current.length > 0 && (currentVideoSize + event.data.size - removedSize) > MAX_VIDEO_SIZE) {
            const removedChunk = recordedChunksRef.current.shift();
            if (removedChunk) {
              removedSize += removedChunk.size;
            }
          }
          setCurrentVideoSize(prev => prev - removedSize + event.data.size);
        } else {
          setCurrentVideoSize(newSize);
        }
        
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.start(1000); // Record in 1-second chunks
    mediaRecorderRef.current = mediaRecorder;
  };

  // Restart speech recognition with error handling
  const restartSpeechRecognition = () => {
    if (!isRecording || isProcessing) {
      console.log('⏹️ Skipping restart - not recording or processing');
      return;
    }
    
    console.log('🔄 Attempting to restart speech recognition...');
    
    // Stop current recognition if running
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.log('Stop recognition error (ignored):', err);
      }
    }
    
    setIsListening(false);
    
    // Start after a short delay to ensure cleanup
    setTimeout(() => {
      if (isRecording && !isProcessing && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          console.log('✅ Speech recognition restarted successfully');
        } catch (error: any) {
          console.log('⚠️ Failed to restart speech recognition:', error.message);
          
          // For common errors, try again after a longer delay
          if (error.message.includes('already started') || error.message.includes('not-allowed')) {
            setTimeout(() => {
              if (isRecording && !isProcessing) {
                restartSpeechRecognition();
              }
            }, 2000);
          }
        }
      }
    }, 500);
  };

  // Start speech recognition
  const startSpeechRecognition = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        setFinalTranscript('');
        latestTranscriptRef.current = {final: '', interim: ''};
        recognitionRef.current.start();
        setIsListening(true);
        console.log('🎤 Speech recognition started');
      } catch (error) {
        console.log('ℹ️ Speech recognition start prevented:', error);
        // If already running, just set listening state
        setIsListening(true);
      }
    }
  };

  // Stop screen recording
  const stopScreenRecording = () => {
    console.log('⏹️ Stopping Screen Recording...');
    
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    setScreenStream(null);
    setIsRecording(false);
    setIsListening(false);
    setTranscript('');
    setFinalTranscript('');
    
  };

  // Process speech and send to Gemini (updated to handle manual input)
  const handleProcessSpeech = async (manualText?: string) => {
    const currentTranscript = manualText || (finalTranscript + ' ' + transcript).trim();
    
    // Prevent concurrent processing - if already processing, reject this request
    if (isProcessing) {
      console.log('❌ Already processing, rejecting new request:', currentTranscript);
      // Clear the current transcript to prevent it from appearing in history
      setTranscript('');
      setFinalTranscript('');
      setManualInput('');
      latestTranscriptRef.current = {final: '', interim: ''};
      return;
    }
    
    if (!currentTranscript || !selectedGrade || !selectedStyle || !isRecording) {
      console.log('❌ Cannot process - missing requirements:', {
        hasTranscript: !!currentTranscript,
        hasGrade: !!selectedGrade,
        hasStyle: !!selectedStyle,
        isRecording
      });
      return;
    }

    console.log('✅ Processing speech:', currentTranscript);
    setIsProcessing(true);

    // Clear any pending silence timer and countdown
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setSilenceCountdown(null);

    try {
      // Create video blob from recorded chunks
      const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      console.log('📹 Video blob size:', videoBlob.size, 'bytes');
      
      if (videoBlob.size > 0) {
        // Add user message to chat
        setChatHistory(prev => [...prev, {
          role: 'user',
          text: currentTranscript,
          timestamp: Date.now()
        }]);

        // Send to Gemini
        await sendVideoToGemini(videoBlob, currentTranscript);
        
        // Clear transcripts and manual input after successful processing
        setTranscript('');
        setFinalTranscript('');
        setManualInput('');
        setShowManualInput(false);
        latestTranscriptRef.current = {final: '', interim: ''};
        console.log('🧹 Transcripts cleared, ready for next speech');
        
      } else {
        throw new Error('No video recorded');
      }

    } catch (err: any) {
      console.error('❌ Failed to process speech:', err);
      setError(`Failed to process: ${err.message}`);
      
      // Clear transcripts even on error
      setTranscript('');
      setFinalTranscript('');
      setManualInput('');
      setShowManualInput(false);
      latestTranscriptRef.current = {final: '', interim: ''};
      
    } finally {
      setIsProcessing(false);
      
      // Restart speech recognition after processing is complete (only if auto-send is enabled)
      setTimeout(() => {
        if (isRecording && autoSendEnabled) {
          restartSpeechRecognition();
        }
      }, 1000);
    }
  };

  // Stop AI processing
  const stopProcessing = () => {
    setIsProcessing(false);
    
    // Clear any pending timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setSilenceCountdown(null);
    
    // Clear any pending transcripts that weren't processed
    setTranscript('');
    setFinalTranscript('');
    setManualInput('');
    latestTranscriptRef.current = {final: '', interim: ''};
    
    console.log('🛑 AI processing stopped by user - cleared pending transcripts');
    
    // Restart speech recognition after stopping
    setTimeout(() => {
      restartSpeechRecognition();
    }, 500);
  };

  // Send video to Gemini API
  const sendVideoToGemini = async (videoBlob: Blob, userPrompt: string) => {
    try {
      console.log('🤖 Sending to Gemini...');

      const formData = new FormData();
      formData.append('video', videoBlob, 'screen-recording.webm');
      formData.append('prompt', createGeminiPrompt(userPrompt));
      formData.append('grade', selectedGrade || '');
      formData.append('style', selectedStyle || '');

      const response = await fetch('/api/gemini-video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setChatHistory(prev => [...prev, {
          role: 'ai',
          text: data.data.response,
          timestamp: Date.now()
        }]);

        // Start speech immediately with the text - no waiting
        speakResponse(data.data.response);
      } else {
        throw new Error(data.message || 'API error');
      }

    } catch (err: any) {
      console.error('❌ Gemini API error:', err);
      setError(`AI Error: ${err.message}`);
    }
  };

  // Create contextual prompt with chat history
  const createGeminiPrompt = (userPrompt: string) => {
    const gradeContext = selectedGrade ? `for ${selectedGrade} level` : '';
    const styleContext = selectedStyle === 'professor' ? 'in a professional academic manner' : 'in a friendly, casual manner';
    
    // Check for simple acknowledgments that need short responses
    const simpleResponses = ['thank you', 'thanks', 'okay', 'ok', 'got it', 'understood'];
    const isSimpleAcknowledgment = simpleResponses.some(phrase => 
      userPrompt.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (isSimpleAcknowledgment) {
      return `The user said: "${userPrompt}" - This seems like a simple acknowledgment. Please respond briefly and naturally (1-2 sentences max) ${styleContext}.`;
    }
    
    // Build chat history context
    let historyContext = '';
    if (chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-4); // Last 4 messages for context
      historyContext = '\n\nPrevious conversation context:\n';
      recentHistory.forEach(msg => {
        historyContext += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}\n`;
      });
      historyContext += '\n';
    }
    
    return `You are an AI assistant analyzing what's happening on the user's screen. The user said: "${userPrompt}"
${historyContext}
Please analyze the screen recording and provide helpful suggestions, explanations, or answers ${gradeContext} ${styleContext}.

Focus on:
- What you can see on the screen
- Educational content visible
- Relevant help based on what's displayed
- Interactive guidance if applicable
- Continue the conversation naturally based on previous context

Keep responses conversational, helpful, and under 100 words unless more detail is specifically needed.`;
  };

  // Text-to-speech with audio management
  const speakResponse = async (text: string) => {
    try {
      // Stop any currently playing audio before starting new one
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'alloy', format: 'mp3' }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        currentAudioRef.current = audio;
        
        audio.onended = () => {
          currentAudioRef.current = null;
        };
        
        // Start audio immediately without await
        audio.play().catch(err => {
          console.error('Audio play failed:', err);
          currentAudioRef.current = null;
        });
      }
    } catch (err) {
      console.error('❌ TTS error:', err);
    }
  };

  // Periodic check to ensure speech recognition stays active (only if auto-send is enabled)
  useEffect(() => {
    if (!isRecording || !autoSendEnabled) return;
    
    const checkInterval = setInterval(() => {
      if (isRecording && !isProcessing && !isListening && recognitionRef.current && autoSendEnabled) {
        console.log('🔄 Periodic restart - speech recognition was not listening');
        restartSpeechRecognition();
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(checkInterval);
  }, [isRecording, isProcessing, isListening, autoSendEnabled]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowGradeDropdown(false);
        setShowStyleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className='min-h-screen flex flex-col relative bg-gradient-to-br from-orange-50 via-white to-red-50'>
      {/* Onboarding overlay */}
      {showOnboarding && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-40 pointer-events-none"></div>
      )}

      {/* Onboarding tooltip for Class Selection */}
      {showOnboarding && onboardingStep === 1 && !showGradeDropdown && (
        <div className="fixed top-[180px] right-32 sm:right-36 lg:right-44 z-[60] pointer-events-auto">
          <img
            src="/images/arrow.svg"
            alt="onboarding"
            className="w-[19px] h-[59px] object-cover mx-auto mb-5"
          />
          <div className="w-[280px] p-4 text-center rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white mb-2">
            {selectedGrade ? (
              <div>
                <div className="mb-2">Great! You've selected:</div>
                <div className="text-sm opacity-90">
                  Class: {selectedGrade}
                </div>
                <div className="text-xs mt-2 opacity-75">Now let's choose your style...</div>
              </div>
            ) : (
              <div>
                <div className="mb-2">First, choose your grade level.</div>
                <div className="text-xs opacity-75">
                  This helps me teach at the right level for you.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onboarding tooltip for Style Selection */}
      {showOnboarding && onboardingStep === 2 && !showStyleDropdown && (
        <div className="fixed top-[180px] right-4 sm:right-8 lg:right-12 z-[60] pointer-events-auto">
          <img
            src="/images/arrow.svg"
            alt="onboarding"
            className="w-[19px] h-[59px] object-cover mx-auto mb-5"
          />
          <div className="w-[280px] p-4 text-center rounded-lg bg-gradient-to-r from-green-500 to-blue-500 text-white mb-2">
            {selectedStyle ? (
              <div>
                <div className="mb-2">Perfect! You've selected:</div>
                <div className="text-sm opacity-90">
                  Style: {selectedStyle}
                </div>
                <div className="text-xs mt-2 opacity-75">Now you can start recording and learning!</div>
              </div>
            ) : (
              <div>
                <div className="mb-2">Now choose how you'd like me to talk to you.</div>
                <div className="text-xs opacity-75">
                  Professor or Friend - pick your style!
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Only show floating selectors during recording */}
      {isRecording && (
        <div className='fixed z-50 flex flex-row items-center gap-3 right-4 sm:right-8 lg:right-12 top-6 pointer-events-auto'>
          <div className='flex flex-row gap-3 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-2xl'>
            <div className='flex items-center gap-2 text-sm text-gray-700'>
              <span className='font-medium'>{selectedGrade}</span>
              <span>•</span>
              <span className='font-medium'>{selectedStyle}</span>
            </div>
          </div>
        </div>
      )}

      <div className='w-full px-4 lg:px-8 pt-20'>
        {/* Enhanced Welcome & Onboarding */}
        {!isRecording && chatHistory.length === 0 && (
          <div className='flex flex-col items-center max-w-6xl mx-auto mb-8 mt-8'>
            {/* Top Selectors */}
            <div className="w-full flex justify-end mb-8">
              <div className="flex flex-row items-center gap-[10px]">
                {/* Class & Style selectors inside gradient */}
                <div
                  className="flex flex-row gap-3 p-4 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255, 159, 39, 0.08) 0%, rgba(255, 81, 70, 0.08) 100%)",
                  }}
                >
                  {[
                    {
                      label: "Class",
                      value: selectedGrade,
                      onClick: () => {
                        setShowGradeDropdown((v) => !v);
                        setShowStyleDropdown(false);
                      },
                      options: grades,
                      showDropdown: showGradeDropdown,
                      onSelect: (val: string) => {
                        setSelectedGrade(val);
                        setShowGradeDropdown(false);
                      },
                    },
                    {
                      label: "Style",
                      value: selectedStyle,
                      onClick: () => {
                        setShowStyleDropdown((v) => !v);
                        setShowGradeDropdown(false);
                      },
                      options: styles,
                      showDropdown: showStyleDropdown,
                      onSelect: (val: string) => {
                        setSelectedStyle(val);
                        setShowStyleDropdown(false);
                      },
                    },
                  ].map(({ label, value, onClick, options, showDropdown, onSelect }, i) => (
                    <div key={i} className="relative dropdown-container">
                      <button
                        className={`flex items-center transition-all duration-200 rounded-xl px-4 py-2.5 min-w-[120px] sm:min-w-[140px] justify-between backdrop-blur-sm ${
                          value
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25"
                            : "bg-white hover:bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md shadow-sm"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onClick();
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium whitespace-nowrap flex items-center">
                            <span className="mr-1">{label}:</span>
                            <span className="font-semibold">{value || "Select"}</span>
                            <ChevronDownIcon className={`ml-2 size-4 shrink-0 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                          </span>
                        </div>
                      </button>

                      {showDropdown && (
                        <div className="absolute mt-2 z-50 bg-white rounded-xl shadow-xl max-h-[300px] overflow-y-auto w-full border border-gray-200 dropdown-container animate-in fade-in-0 zoom-in-95 duration-200">
                          {/* Header */}
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-t-xl border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">Select {label}</span>
                          </div>
                          {/* Options */}
                          {options.map((opt: any) => {
                            const key = typeof opt === 'string' ? opt : opt.label;
                            const optValue = typeof opt === 'string' ? opt : opt.value;

                            return (
                              <div
                                key={key}
                                className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0 transition-all duration-150 hover:shadow-sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onSelect(optValue);
                                }}
                              >
                                {key}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className='relative text-center mb-12 px-6'>
              <div className='absolute inset-0 bg-gradient-to-r from-orange-400/20 to-red-400/20 blur-3xl rounded-full'></div>
              <div className='relative'>
                <div className='inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 px-4 py-2 rounded-full text-sm font-medium text-orange-700 mb-6'>
                  <span className='w-2 h-2 bg-orange-500 rounded-full animate-pulse'></span>
                  AI-Powered Screen Assistant
                </div>
                <h1 className='text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight'>
                  Smart Learning
                  <br />
                  <span className='text-3xl md:text-5xl'>with Voice & Vision</span>
                </h1>
                <p className='text-xl text-gray-700 mb-4 max-w-2xl mx-auto leading-relaxed'>
                  Share your screen, ask questions naturally, and get instant AI-powered help tailored to your learning level
                </p>
                <div className='flex flex-wrap justify-center gap-2 text-sm text-gray-600'>
                  <span className='bg-white/80 px-3 py-1 rounded-full'>Real-time Analysis</span>
                  <span className='bg-white/80 px-3 py-1 rounded-full'>Voice Commands</span>
                  <span className='bg-white/80 px-3 py-1 rounded-full'>Personalized Learning</span>
                </div>
              </div>
            </div>

            {/* Step 1: Settings Selection */}
            {(!selectedGrade || !selectedStyle) && (
              <div className='w-full max-w-4xl mb-12'>
                <div className='text-center mb-8'>
                  <h2 className='text-2xl font-bold text-gray-800 mb-2'>Step 1: Choose Your Learning Profile</h2>
                  <p className='text-gray-600'>Select your grade level and preferred interaction style to get personalized assistance</p>
                  {/* Arrow pointing to selectors */}
                  <div className='flex justify-center mt-4'>
                    <div className='relative'>
                      <div className='text-4xl animate-bounce'>👆</div>
                      <div className='absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-medium text-orange-600 whitespace-nowrap'>
                        Start here
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Settings Selectors */}
                <div className='flex flex-col md:flex-row gap-6 justify-center items-center mb-8'>
                  {/* Grade Selector */}
                  <div className='relative dropdown-container'>
                    <button
                      className={`flex items-center transition-all duration-300 rounded-xl px-6 py-4 min-w-[200px] justify-between font-medium text-base ${
                        selectedGrade
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-white text-gray-700 border-2 border-orange-300 hover:border-orange-400 hover:bg-orange-50 shadow-lg animate-pulse'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowGradeDropdown(!showGradeDropdown);
                        setShowStyleDropdown(false);
                      }}
                    >
                      <div className='flex items-center gap-3'>
                        <div className={`w-3 h-3 rounded-full ${selectedGrade ? 'bg-white' : 'bg-orange-400'}`}></div>
                        <span>
                          {selectedGrade || 'Select Your Grade Level'}
                        </span>
                      </div>
                      <ChevronDownIcon className={`ml-2 h-5 w-5 transition-transform duration-200 ${showGradeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showGradeDropdown && (
                      <div className='absolute mt-3 z-[9999] bg-white rounded-2xl shadow-2xl max-h-[300px] overflow-y-auto w-full border border-gray-200'>
                        <div className='p-3'>
                          <div className='text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wide'>Select Your Grade</div>
                          {grades.map((grade) => (
                            <div
                              key={grade}
                              className={`px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm rounded-xl mx-1 transition-colors duration-150 flex items-center justify-between ${
                                selectedGrade === grade ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-700'
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedGrade(grade);
                                setShowGradeDropdown(false);
                              }}
                            >
                              <span>{grade}</span>
                              {selectedGrade === grade && (
                                <svg className='w-4 h-4 text-orange-600' fill='currentColor' viewBox='0 0 20 20'>
                                  <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Style Selector */}
                  <div className='relative dropdown-container'>
                    <button
                      className={`flex items-center transition-all duration-300 rounded-xl px-6 py-4 min-w-[200px] justify-between font-medium text-base ${
                        selectedStyle
                          ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-white text-gray-700 border-2 border-green-300 hover:border-green-400 hover:bg-green-50 shadow-lg animate-pulse'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowStyleDropdown(!showStyleDropdown);
                        setShowGradeDropdown(false);
                      }}
                    >
                      <div className='flex items-center gap-3'>
                        <div className={`w-3 h-3 rounded-full ${selectedStyle ? 'bg-white' : 'bg-green-400'}`}></div>
                        <span>
                          {selectedStyle ? styles.find(s => s.value === selectedStyle)?.label : 'Select Interaction Style'}
                        </span>
                      </div>
                      <ChevronDownIcon className={`ml-2 h-5 w-5 transition-transform duration-200 ${showStyleDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showStyleDropdown && (
                      <div className='absolute mt-3 z-[9999] bg-white rounded-2xl shadow-2xl max-h-[200px] overflow-y-auto w-full border border-gray-200'>
                        <div className='p-3'>
                          <div className='text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wide'>Interaction Style</div>
                          {styles.map((style) => (
                            <div
                              key={style.value}
                              className={`px-4 py-4 hover:bg-green-50 cursor-pointer text-sm rounded-xl mx-1 transition-colors duration-150 ${
                                selectedStyle === style.value ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-700'
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedStyle(style.value);
                                setShowStyleDropdown(false);
                              }}
                            >
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                  <span className='text-lg'>
                                    {style.value === 'professor' ? '🎓' : '😊'}
                                  </span>
                                  <div>
                                    <div className='font-medium'>{style.label}</div>
                                    <div className='text-xs text-gray-500'>
                                      {style.value === 'professor' ? 'Formal, detailed explanations' : 'Casual, friendly conversations'}
                                    </div>
                                  </div>
                                </div>
                                {selectedStyle === style.value && (
                                  <svg className='w-4 h-4 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Auto-Send Settings */}
            {selectedGrade && selectedStyle && (
              <div className='w-full max-w-4xl mb-12'>
                <div className='text-center mb-8'>
                  <h2 className='text-2xl font-bold text-gray-800 mb-2'>Step 2: Configure Voice Settings</h2>
                  <p className='text-gray-600'>Choose how you want to interact with the AI assistant</p>
                </div>
                
                <div className='bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${autoSendEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div 
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 ${autoSendEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}
                        ></div>
                      </div>
                      <div>
                        <h3 className='font-semibold text-gray-800'>Auto-Send Mode</h3>
                        <p className='text-sm text-gray-600'>
                          {autoSendEnabled ? 'Questions sent automatically after 3 seconds of silence' : 'Manual control - you decide when to send'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAutoSendEnabled(!autoSendEnabled)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        autoSendEnabled 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {autoSendEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  
                  <div className='grid md:grid-cols-2 gap-4 text-sm'>
                    <div className={`p-4 rounded-xl border-2 transition-all ${autoSendEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className='flex items-center gap-2 mb-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span className='font-medium text-green-700'>Auto-Send ON</span>
                      </div>
                      <ul className='text-gray-600 space-y-1'>
                        <li>• Speak naturally and pause</li>
                        <li>• AI responds after 3 seconds</li>
                        <li>• Perfect for fluid conversations</li>
                        <li>• Hands-free experience</li>
                      </ul>
                    </div>
                    
                    <div className={`p-4 rounded-xl border-2 transition-all ${!autoSendEnabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className='flex items-center gap-2 mb-2'>
                        <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                        <span className='font-medium text-blue-700'>Auto-Send OFF</span>
                      </div>
                      <ul className='text-gray-600 space-y-1'>
                        <li>• Edit your transcript before sending</li>
                        <li>• Type additional text if needed</li>
                        <li>• Manual send button control</li>
                        <li>• Perfect for complex questions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className='flex flex-col items-center gap-4'>
                  <button
                    onClick={startScreenRecording}
                    className='group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-12 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3'
                  >
                    <div className='relative'>
                      <MonitorIcon className='w-6 h-6 group-hover:animate-pulse' />
                      <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping'></div>
                    </div>
                    Start Learning Session
                  </button>
                  <p className='text-sm text-gray-600 max-w-md text-center'>
                    Your session will be personalized for <span className='font-medium text-orange-600'>{selectedGrade}</span> level with a <span className='font-medium text-green-600'>{selectedStyle}</span> interaction style
                    {autoSendEnabled ? ' and auto-send enabled' : ' with manual control'}
                  </p>
                </div>
              </div>
            )}

            {/* Feature Highlights - Only show if settings not selected */}
            {(!selectedGrade || !selectedStyle) && (
              <div className='max-w-5xl mx-auto mt-16 grid md:grid-cols-3 gap-8'>
                <div className='group p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-sm border border-blue-100 hover:shadow-lg transition-all duration-300'>
                  <div className='text-4xl mb-4 group-hover:scale-110 transition-transform duration-300'>🎥</div>
                  <h3 className='font-bold mb-3 text-gray-800 text-lg'>Intelligent Screen Analysis</h3>
                  <p className='text-gray-600 leading-relaxed'>AI analyzes your screen content in real-time, understanding context and providing relevant help for your current task</p>
                </div>
                <div className='group p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-sm border border-green-100 hover:shadow-lg transition-all duration-300'>
                  <div className='text-4xl mb-4 group-hover:scale-110 transition-transform duration-300'>🎤</div>
                  <h3 className='font-bold mb-3 text-gray-800 text-lg'>Natural Voice Interaction</h3>
                  <p className='text-gray-600 leading-relaxed'>Speak naturally and get instant responses. No need for specific commands - just ask questions as you would to a human tutor</p>
                </div>
                <div className='group p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-sm border border-purple-100 hover:shadow-lg transition-all duration-300'>
                  <div className='text-4xl mb-4 group-hover:scale-110 transition-transform duration-300'>🎯</div>
                  <h3 className='font-bold mb-3 text-gray-800 text-lg'>Personalized Learning</h3>
                  <p className='text-gray-600 leading-relaxed'>Responses are tailored to your grade level and learning style, ensuring optimal comprehension and engagement</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Screen Recording Interface - Status Only */}
        {isRecording && (
          <div className='flex flex-col items-center max-w-4xl mx-auto mb-8'>
            {/* Status Indicators */}
            <div className='flex flex-wrap items-center justify-center gap-4 mt-4 text-sm'>
              <div className='flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span className='text-gray-700'>Screen Active</span>
              </div>
              <div className='flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full'>
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className='text-gray-700'>{isListening ? 'Listening...' : 'Voice Ready'}</span>
              </div>
              <div className='flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full'>
                <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-purple-500 animate-pulse' : 'bg-blue-500'}`}></div>
                <span className='text-gray-700'>{isProcessing ? 'Processing...' : 'AI Ready'}</span>
              </div>
              <div className='flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full'>
                <div className={`w-2 h-2 rounded-full ${autoSendEnabled ? 'bg-orange-500' : 'bg-gray-500'}`}></div>
                <span className='text-gray-700'>{autoSendEnabled ? '3-sec auto-send' : 'Manual send'}</span>
              </div>
            </div>
            {/* Control Buttons */}
            <div className='flex gap-3 mt-6'>
              <button
                onClick={stopScreenRecording}
                className='bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg'
              >
                <StopCircleIcon className='w-4 h-4' />
                Stop Recording
              </button>

              {/* Auto-send toggle */}
              <button
                onClick={() => setAutoSendEnabled(!autoSendEnabled)}
                className={`px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg ${
                  autoSendEnabled 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${autoSendEnabled ? 'bg-white' : ''}`}>
                  {autoSendEnabled && <div className='w-2 h-2 bg-orange-500 rounded-full'></div>}
                </div>
                Auto-send {autoSendEnabled ? 'ON' : 'OFF'}
              </button>

              {/* Stop AI Processing */}
              {isProcessing && (
                <button
                  onClick={stopProcessing}
                  className='bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg'
                >
                  <StopCircleIcon className='w-4 h-4' />
                  Stop AI
                </button>
              )}

              {/* Manual Process Button */}
              {(finalTranscript.trim() || transcript.trim()) && !autoSendEnabled && (
                <button
                  onClick={() => handleProcessSpeech()}
                  disabled={isProcessing}
                  className='bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg'
                >
                  <SendIcon className='w-4 h-4' />
                  Send Question
                </button>
              )}

              {/* Manual Input Toggle */}
              {!autoSendEnabled && (
                <button
                  onClick={() => setShowManualInput(!showManualInput)}
                  className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                  </svg>
                  Type Input
                </button>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Live Transcript & Manual Input - Fixed Bottom Panel */}
        {isRecording && (finalTranscript || transcript || showManualInput) && (
          <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50'>
            <div className='max-w-7xl mx-auto p-4'>
              <div className='flex items-center justify-between mb-3'>
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${showManualInput ? 'bg-blue-500' : 'bg-red-500'}`}>
                      {showManualInput ? (
                        <svg className='w-3 h-3 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                        </svg>
                      ) : (
                        <MicIcon className='w-3 h-3 text-white' />
                      )}
                    </div>
                    {!showManualInput && <div className='absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400 rounded-full animate-ping'></div>}
                  </div>
                  <div>
                    <span className='text-sm font-medium text-gray-800'>
                      {showManualInput ? 'Manual Input' : 'Live Transcript'}
                    </span>
                    <div className='flex items-center gap-2'>
                      {!showManualInput && autoSendEnabled && silenceCountdown !== null && !isProcessing && (
                        <span className='text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1'>
                          <div className='w-1 h-1 bg-orange-500 rounded-full animate-pulse'></div>
                          Auto-send in {silenceCountdown}s
                        </span>
                      )}
                      {!isListening && isProcessing && (
                        <span className='text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1'>
                          <div className='w-1 h-1 bg-blue-500 rounded-full animate-spin'></div>
                          Processing... (new requests blocked)
                        </span>
                      )}
                      {!showManualInput && isListening && !silenceCountdown && !isProcessing && (
                        <span className='text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1'>
                          <div className='w-1 h-1 bg-green-500 rounded-full animate-pulse'></div>
                          Listening
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  {/* Auto-send toggle */}
                  <button
                    onClick={() => setAutoSendEnabled(!autoSendEnabled)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      autoSendEnabled 
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Auto {autoSendEnabled ? 'ON' : 'OFF'}
                  </button>

                  {/* Send Button */}
                  {(finalTranscript.trim() || transcript.trim() || manualInput.trim()) && !isProcessing && (
                    <button
                      onClick={() => handleProcessSpeech(manualInput || undefined)}
                      className='w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors'
                    >
                      <SendIcon className='w-3 h-3 text-white' />
                    </button>
                  )}

                  {/* Stop Button */}
                  {isProcessing && (
                    <button
                      onClick={stopProcessing}
                      className='w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors'
                    >
                      <StopCircleIcon className='w-3 h-3 text-white' />
                    </button>
                  )}
                  
                  {/* Clear Button */}
                  <button
                    onClick={() => {
                      setTranscript('');
                      setFinalTranscript('');
                      setManualInput('');
                      setShowManualInput(false);
                      latestTranscriptRef.current = {final: '', interim: ''};
                    }}
                    className='w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors'
                  >
                    <svg className='w-3 h-3 text-gray-600' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clipRule='evenodd' />
                    </svg>
                  </button>

                  {/* Mode Toggle */}
                  <button
                    onClick={() => setShowManualInput(!showManualInput)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      showManualInput ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {showManualInput ? (
                      <MicIcon className='w-3 h-3 text-blue-600' />
                    ) : (
                      <svg className='w-3 h-3 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Input Area */}
              <div className='bg-gray-50 rounded-lg p-3 min-h-[60px]'>
                {showManualInput ? (
                  <textarea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder='Type your question here...'
                    className='w-full bg-transparent resize-none outline-none text-gray-800 font-medium leading-relaxed placeholder-gray-400'
                    rows={2}
                    autoFocus
                  />
                ) : (
                  <div className='min-h-[40px] flex items-center'>
                    <p className='text-gray-800 font-medium leading-relaxed'>
                      {finalTranscript && (
                        <span className='text-blue-700 font-semibold'>{finalTranscript}</span>
                      )}
                      {transcript && (
                        <span className='text-gray-600 ml-1'>{transcript}</span>
                      )}
                      {isListening && (
                        <span className='inline-block w-0.5 h-4 bg-orange-500 ml-1 animate-pulse'></span>
                      )}
                      {!finalTranscript && !transcript && (
                        <span className='text-gray-400 italic'>
                          {autoSendEnabled ? 'Start speaking...' : 'Click mic or type to start...'}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className='flex justify-center mb-8'>
            <div className='bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg'>
              <SpruceBall listening={true} />
              <p className='text-center mt-3 text-gray-600 font-medium'>Analyzing screen...</p>
            </div>
          </div>
        )}

        {/* Enhanced Chat History */}
        {chatHistory.length > 0 && (
          <div className='max-w-5xl mx-auto pb-40'>
            {/* Chat Header */}
            <div className='sticky top-0 z-30 bg-gradient-to-r from-orange-50/90 to-red-50/90 backdrop-blur-md border-b border-orange-200/50 rounded-t-2xl p-6 mb-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center'>
                    <span className='text-white font-bold text-sm'>AI</span>
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-gray-800'>Learning Session</h3>
                    <p className='text-sm text-gray-600'>{chatHistory.length} messages • {selectedGrade} • {selectedStyle} style</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='flex items-center gap-1 bg-white/80 px-3 py-1.5 rounded-full text-xs'>
                    <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                    <span className='text-gray-700'>Active Session</span>
                  </div>
                  <button
                    onClick={() => setChatHistory([])}
                    className='p-2 hover:bg-white/60 rounded-full transition-colors text-gray-600 hover:text-gray-800'
                    title='Clear chat'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className='space-y-6 px-4'>
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* AI Avatar & Info */}
                  {msg.role === 'ai' && (
                    <div className='flex flex-col items-center gap-2 flex-shrink-0'>
                      <div className='w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center shadow-lg'>
                        <span className='text-white font-bold text-sm'>AI</span>
                      </div>
                      <div className='text-xs text-gray-500 text-center max-w-[60px]'>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div
                    className={`group relative max-w-[75%] ${
                      msg.role === 'user'
                        ? 'order-first'
                        : ''
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white ml-auto'
                          : 'bg-white text-gray-800 border border-gray-200 hover:border-orange-200'
                      }`}
                    >
                      <div className='prose prose-sm max-w-none'>
                        <p className={`leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                          {msg.text}
                        </p>
                      </div>
                      
                      {/* Message Actions */}
                      <div className={`flex items-center justify-between mt-3 pt-2 border-t ${msg.role === 'user' ? 'border-white/20' : 'border-gray-100'}`}>
                        <span className={`text-xs ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                        
                        {msg.role === 'ai' && (
                          <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <button
                              onClick={() => speakResponse(msg.text)}
                              className='p-1.5 hover:bg-gray-100 rounded-full transition-colors'
                              title='Read aloud'
                            >
                              <svg className='w-3.5 h-3.5 text-gray-600' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.789L4.5 13.382A.5.5 0 014 13V7a.5.5 0 01.382-.49l3.883-2.907zm7.425 1.228a.75.75 0 01-.021 1.06A6.5 6.5 0 0118 10a6.5 6.5 0 01-1.213 4.636.75.75 0 11-1.06-1.06A5 5 0 0017 10a5 5 0 00-1.273-3.364.75.75 0 011.06-.021z' clipRule='evenodd' />
                              </svg>
                            </button>
                            <button
                              className='p-1.5 hover:bg-gray-100 rounded-full transition-colors'
                              title='Copy response'
                              onClick={() => navigator.clipboard.writeText(msg.text)}
                            >
                              <svg className='w-3.5 h-3.5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Message Status */}
                    {msg.role === 'ai' && idx === chatHistory.length - 1 && (
                      <div className='flex items-center gap-2 mt-2 text-xs text-gray-500'>
                        <div className='w-1.5 h-1.5 bg-green-400 rounded-full'></div>
                        Latest response
                      </div>
                    )}
                  </div>
                  
                  {/* User Avatar & Info */}
                  {msg.role === 'user' && (
                    <div className='flex flex-col items-center gap-2 flex-shrink-0'>
                      <div className='w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center shadow-lg'>
                        <span className='text-white font-bold text-sm'>You</span>
                      </div>
                      <div className='text-xs text-gray-500 text-center max-w-[60px]'>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Scroll Anchor */}
              <div ref={chatBottomRef} />
            </div>

            {/* Session Summary */}
            {chatHistory.length > 5 && (
              <div className='mt-8 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center'>
                    <svg className='w-4 h-4 text-orange-600' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <h4 className='font-semibold text-gray-800'>Session Summary</h4>
                </div>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                  <div className='text-center p-3 bg-white/60 rounded-xl'>
                    <div className='font-bold text-lg text-orange-600'>{chatHistory.length}</div>
                    <div className='text-gray-600'>Messages</div>
                  </div>
                  <div className='text-center p-3 bg-white/60 rounded-xl'>
                    <div className='font-bold text-lg text-blue-600'>{chatHistory.filter(m => m.role === 'user').length}</div>
                    <div className='text-gray-600'>Questions</div>
                  </div>
                  <div className='text-center p-3 bg-white/60 rounded-xl'>
                    <div className='font-bold text-lg text-green-600'>{selectedGrade}</div>
                    <div className='text-gray-600'>Level</div>
                  </div>
                  <div className='text-center p-3 bg-white/60 rounded-xl'>
                    <div className='font-bold text-lg text-purple-600'>{Math.round((Date.now() - chatHistory[0]?.timestamp) / 60000) || 0}m</div>
                    <div className='text-gray-600'>Duration</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className='fixed bottom-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl z-50 max-w-md mx-auto'>
            <p className='font-medium text-sm'>{error}</p>
            <button
              onClick={() => setError(null)}
              className='mt-2 text-xs underline hover:no-underline'
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
