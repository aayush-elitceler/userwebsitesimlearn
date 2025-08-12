// components/ChatGPTVoiceInterface.tsx
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import Cookies from 'js-cookie';
import { encode } from 'gpt-tokenizer';
import SpruceBall from '@/components/SpruceBall';

interface ChatGPTVoiceInterfaceProps {
  selectedGrade: string | null;
  selectedStyle: string | null;
  onClose: () => void;
  onConversationEnd: (history: { role: 'user' | 'ai'; text: string }[]) => void;
}

export default function ChatGPTVoiceInterface({
  selectedGrade,
  selectedStyle,
  onClose,
  onConversationEnd,
}: ChatGPTVoiceInterfaceProps) {
  // Speech recognition state
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [apiLoading, setApiLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { role: 'user' | 'ai'; text: string }[]
  >([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<
    'granted' | 'denied' | 'prompt' | 'unknown'
  >('unknown');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Check browser support and microphone permission on mount
  useEffect(() => {
    const checkPermissions = async () => {
      // Check if HTTPS is being used
      if (
        typeof window !== 'undefined' &&
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost'
      ) {
        setSpeechError('Voice recognition requires HTTPS connection');
        return;
      }

      // Check browser support
      if (!browserSupportsSpeechRecognition) {
        setSpeechError('Your browser does not support speech recognition');
        return;
      }

      // Check microphone permission
      try {
        const permission = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        setMicrophonePermission(permission.state);

        permission.addEventListener('change', () => {
          setMicrophonePermission(permission.state);
        });
      } catch (error) {
        console.error('Error checking microphone permission:', error);
        // Fallback for browsers that don't support permissions API
        setMicrophonePermission('unknown');
      }
    };

    checkPermissions();
  }, [browserSupportsSpeechRecognition]);

  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!listening) {
      handleStopListening();
    }
    // @ts-ignore
  }, [listening, handleStopListening]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, thinking, aiSpeaking, displayedText]);

  // Send message to API with better error handling and speech synthesis integration
  const handleSend = useCallback(async () => {
    if (!selectedGrade || !selectedStyle || !transcript.trim()) return;

    setApiLoading(true);
    setThinking(true);
    setDisplayedText(''); // Clear any previous displayed text
    // Store user message temporarily but don't add to chat history yet
    const userMessage = transcript.trim();

    try {
      const authCookie = Cookies.get('auth');
      let token: string | undefined;
      if (authCookie) {
        try {
          token = JSON.parse(authCookie).token;
        } catch (e) {
          console.error('Error parsing auth cookie:', e);
        }
      }

      const res = await fetch(
        'https://apisimplylearn.selflearnai.in/api/v1/ai/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            class: selectedGrade.replace(/\D/g, ''),
            style: selectedStyle.toLowerCase(),
            message: userMessage,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const responseText =
        data?.data?.response || "Sorry, I couldn't process your request.";

      // Token/Model Logging
      const model = 'Gemini 1.0 Pro';
      const inputTokens = encode(userMessage).length;
      const outputTokens = encode(responseText).length;
      const inputPricePer1K = 0.002;
      const outputPricePer1K = 0.006;
      const inputCost = (inputTokens / 1000) * inputPricePer1K;
      const outputCost = (outputTokens / 1000) * outputPricePer1K;
      const totalCost = inputCost + outputCost;

      console.log('--- AI Chat Log ---');
      console.log('Model:', model);
      console.log('Input tokens:', inputTokens);
      console.log('Output tokens:', outputTokens);
      console.log('Input cost:', inputCost.toFixed(6));
      console.log('Output cost:', outputCost.toFixed(6));
      console.log('Total cost:', totalCost.toFixed(6));

      // Start speech synthesis immediately - this implements the ChatGPT-like behavior
      // where the assistant starts speaking immediately after the user stops
      setThinking(false); // Clear thinking state
      setAiSpeaking(true);

      // Create and configure speech synthesis
      const utterance = new SpeechSynthesisUtterance(responseText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to get a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (voice) =>
            voice.lang.startsWith('en') &&
            (voice.name.includes('Female') ||
              voice.name.includes('Samantha') ||
              voice.name.includes('Ava'))
        ) || voices.find((voice) => voice.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // When speech ends, add both messages to chat history
      // This implements the ChatGPT-like behavior where user messages appear only after AI responds
      utterance.onend = () => {
        setAiSpeaking(false);
        // Now add both messages to chat history
        setChatHistory((prev) => [
          ...prev,
          { role: 'user', text: userMessage },
          { role: 'ai', text: responseText },
        ]);
        setDisplayedText(''); // Clear the displayed text since it's now in chat history
      };

      // If speech fails, still add messages to chat history
      utterance.onerror = () => {
        setAiSpeaking(false);
        setChatHistory((prev) => [
          ...prev,
          { role: 'user', text: userMessage },
          { role: 'ai', text: responseText },
        ]);
        setDisplayedText(''); // Clear the displayed text
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);

      // Store the response text for display during speech
      setDisplayedText(responseText);
    } catch (err) {
      console.error('API Error:', err);
      setAiSpeaking(false);
      // In case of error, add both messages
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', text: userMessage },
        {
          role: 'ai' as const,
          text: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setApiLoading(false);
      setThinking(false);
      resetTranscript();
    }
  }, [selectedGrade, selectedStyle, transcript, resetTranscript]);

  // Enhanced stop listening with error handling and auto-submit
  const handleStopListening = useCallback(() => {
    try {
      SpeechRecognition.stopListening();
      setSpeechError(null);

      // Auto-submit if we have transcript and required selections
      if (transcript.trim() && selectedGrade && selectedStyle) {
        // Don't add user message to chat history yet - will be added after AI response
        // This implements the ChatGPT-like behavior where user messages appear only after AI responds
        // Small delay to ensure state is updated, then auto-submit
        setTimeout(() => {
          handleSend();
        }, 100);
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setSpeechError('Failed to stop listening');
    }
  }, [transcript, selectedGrade, selectedStyle, handleSend]);

  // Enhanced start listening with permission and error handling
  const handleStartListening = useCallback(async () => {
    try {
      setSpeechError(null);

      // Check microphone permission first
      if (microphonePermission === 'denied') {
        setSpeechError(
          'Microphone access denied. Please enable microphone permissions in your browser settings.'
        );
        return;
      }

      // Request microphone access explicitly
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permissionError) {
        console.error('Microphone permission error:', permissionError);
        setSpeechError('Please allow microphone access to use voice input');
        return;
      }

      resetTranscript();

      // Start listening with enhanced options
      await SpeechRecognition.startListening({
        continuous: false,
        language: 'en-US',
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setSpeechError('Failed to start voice recognition. Please try again.');
    }
  }, [microphonePermission, resetTranscript]);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When transcript changes, update displayed text
  useEffect(() => {
    if (transcript && listening) {
      // Show user's speech in real-time while they're talking
      setDisplayedText(transcript);
    }
  }, [transcript, listening]);

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col'>
        {/* Header with close button */}
        <div className='flex justify-between items-center p-4 border-b'>
          <h2 className='text-xl font-bold'>Voice Chat</h2>
          <button
            onClick={() => {
              onConversationEnd(chatHistory);
              onClose();
            }}
            className='text-gray-500 hover:text-gray-700'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Chat area */}
        <div className='flex-1 overflow-y-auto p-4'>
          <div className='flex flex-col gap-3'>
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className='max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 point-ask-gradient text-white'>
                    <p className='text-sm md:text-base leading-relaxed'>
                      {msg.text}
                    </p>
                  </div>
                ) : (
                  <div className='max-w-[85%] md:max-w-[75%] bg-[rgba(34,34,34,0.9)] text-white rounded-2xl px-5 py-3 border border-[#007437]/20'>
                    <p className='text-sm md:text-base leading-relaxed'>
                      {msg.text}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {/* AI Speaking - Show the current response while speaking */}
            {aiSpeaking && displayedText && (
              <div className='flex justify-start'>
                <div className='max-w-[85%] md:max-w-[75%] bg-[rgba(34,34,34,0.9)] text-white rounded-2xl px-5 py-3 border border-[#007437]/20'>
                  <p className='text-sm md:text-base leading-relaxed'>
                    {displayedText}
                  </p>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        </div>

        {/* Voice visualization and controls */}
        <div className='flex flex-col items-center justify-center p-6'>
          {/* Show SpruceBall when listening, thinking, or when AI is speaking */}
          {(listening || thinking || aiSpeaking) && (
            <div className='mb-6'>
              <SpruceBall listening={listening || thinking || aiSpeaking} />
            </div>
          )}

          {/* Status text */}
          <div className='mb-4 text-center'>
            {listening && <p className='text-lg'>Listening...</p>}
            {thinking && <p className='text-lg'>Thinking...</p>}
            {aiSpeaking && <p className='text-lg'>Speaking...</p>}
            {!listening && !thinking && !aiSpeaking && (
              <p className='text-lg'>Ready to chat</p>
            )}
          </div>

          {/* Control buttons */}
          <div className='flex gap-4'>
            {!listening && !thinking && !aiSpeaking && (
              <button
                onClick={handleStartListening}
                className='point-ask-gradient text-white px-6 py-3 rounded-full flex items-center gap-2'
                disabled={apiLoading}
              >
                <svg
                  width='20'
                  height='20'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <rect x='9' y='2' width='6' height='12' rx='3' />
                  <path d='M5 10v2a7 7 0 0 0 14 0v-2' />
                  <path d='M12 19v3m-4 0h8' />
                </svg>
                Start Speaking
              </button>
            )}

            {listening && (
              <button
                onClick={handleStopListening}
                className='bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full flex items-center gap-2'
              >
                <svg
                  width='20'
                  height='20'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <rect x='6' y='6' width='12' height='12' rx='2' />
                </svg>
                Stop Speaking
              </button>
            )}

            <button
              onClick={() => {
                onConversationEnd(chatHistory);
                onClose();
              }}
              className='border border-gray-300 text-gray-700 px-6 py-3 rounded-full'
            >
              End Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
