'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import Cookies from 'js-cookie';
import { ArrowRight, ChevronDownIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import VoiceOverlay from '@/components/VoiceOverlay';
import AIMessage from '@/components/VoiceWave';
import { encode } from 'gpt-tokenizer';
import SpruceBall from '@/components/SpruceBall';
import { fetchHistory, HistoryItem } from '@/lib/historyService';
import HistorySlider from '@/components/HistorySlider';

type StyleOption = {
  label: string;
  value: string;
  [key: string]: unknown; // If it might have more props
};
type OptionWithIcon = {
  label: string;
  value: string;
};

type OptionType = string | OptionWithIcon;

const isOptionWithIcon = (opt: OptionType): opt is OptionWithIcon =>
  typeof opt === 'object' && 'label' in opt && 'value' in opt;

// Helper function to format grade for API calls
const formatGradeForAPI = (grade: string): string => {
  if (grade === 'UG') return 'UG';
  if (grade === 'PG') return 'PG';
  return grade.replace(/\D/g, ''); // Extract numbers for regular grades
};

const grades = [
  '1st grade',
  '2nd grade',
  '3rd grade',
  '4th grade',
  '5th grade',
  '6th grade',
  '7th grade',
  '8th grade',
  '9th grade',
  '10th grade',
  '11th grade',
  '12th grade',
  'UG',
  'PG',
];

const styles = [
  {
    label: 'Professor',
    value: 'professor',
  },
  {
    label: 'Friend',
    value: 'friend',
  },
  {
    label: 'Robot',
    value: 'robot',
  },
];

const suggestions = [
  "What is gravity and why don't we float like astronauts?",
  'How do plants make their own food using sunlight and water?',
  'How do plants make their own food using sunlight and water?',
  'How do plants make their own food using sunlight and water?',
];

export default function ImprovedAiChatsVoicePage() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageConfirmed, setIsImageConfirmed] = useState(false);

  // Screen sharing state
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [screenShareStream, setScreenShareStream] =
    useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);

  // Speech recognition state
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [inputValue, setInputValue] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatHistory, setChatHistory] = useState<
    { role: 'user' | 'ai'; text: string; image?: string }[]
  >([]);
  const [streamingMessageIndex, setStreamingMessageIndex] = useState<
    number | null
  >(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<
    'granted' | 'denied' | 'prompt' | 'unknown'
  >('unknown');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const activeSessionRef = useRef(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // === START: History Slider State ===
  const [showHistorySlider, setShowHistorySlider] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // === END: History Slider State ===

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

  // Handle clicks outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showGradeDropdown || showStyleDropdown) {
        const target = event.target as Element;
        if (!target.closest('.dropdown-container')) {
          setShowGradeDropdown(false);
          setShowStyleDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGradeDropdown, showStyleDropdown]);

  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!listening) {
      console.log(true, 'stopListening');
      handleStopListening();
    }
  }, [listening]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, thinking, isStreaming, displayedText]);

  // Bind screen stream to video when available/mounted
  useEffect(() => {
    if (screenVideoRef.current && screenShareStream) {
      try {
        screenVideoRef.current.srcObject = screenShareStream as MediaStream;
        const play = screenVideoRef.current.play();
        if (play && typeof play.then === 'function') {
          play.catch(() => {});
        }
      } catch (e) {
        console.error('Error attaching screen stream:', e);
      }
    }
  }, [screenShareStream, isScreenSharing]);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setImage(URL.createObjectURL(file));
  };

  // Screen share: start
  const startScreenShare = async () => {
    try {
      setScreenShareError(null);
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      setScreenShareStream(stream);
      setIsScreenSharing(true);
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        const onLoaded = () => {
          screenVideoRef.current?.play().catch(() => {});
          screenVideoRef.current?.removeEventListener(
            'loadedmetadata',
            onLoaded
          );
        };
        screenVideoRef.current.addEventListener('loadedmetadata', onLoaded);
      }

      // If user stops from browser UI, reflect here
      const [track] = stream.getVideoTracks();
      track.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Screen share error:', err);
      setScreenShareError('Failed to start screen sharing');
    }
  };

  // Screen share: stop
  const stopScreenShare = () => {
    try {
      screenShareStream?.getTracks().forEach((t) => t.stop());
    } catch {}
    setScreenShareStream(null);
    setIsScreenSharing(false);
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
  };

  // Capture a frame from screen share and use as the chat image
  const captureScreenFrameToFile = async (): Promise<File | null> => {
    if (!screenShareStream) return null;
    const video = screenVideoRef.current;
    if (!video) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], 'screen-capture.png', {
          type: 'image/png',
        });
        resolve(file);
      }, 'image/png');
    });
  };

  const captureScreenFrame = async () => {
    const file = await captureScreenFrameToFile();
    if (!file) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setIsImageConfirmed(true);
  };
  // Send message to API with better error handling
  const handleSend = useCallback(async () => {
    if (!selectedGrade || !selectedStyle || !inputValue.trim()) return;
    const isFirstMessage = chatHistory.length === 0;

    setApiLoading(true);
    setThinking(true);
    setChatHistory((prev) => [
      ...prev,
      {
        role: 'user',
        text: inputValue.trim(),
        image: isFirstMessage ? image || undefined : undefined,
      },
    ]);

    try {
      // If screen sharing and we don't have an imageFile, capture one now
      let outboundImageFile: File | null = imageFile;
      if (!outboundImageFile && screenShareStream) {
        outboundImageFile = await captureScreenFrameToFile();
        if (outboundImageFile) {
          setImageFile(outboundImageFile);
          setImage(URL.createObjectURL(outboundImageFile));
          setIsImageConfirmed(true);
        }
      }

      if (!outboundImageFile) {
        // Still no image; require it for image-chat
        setApiLoading(false);
        setThinking(false);
        return;
      }

      const authCookie = Cookies.get('auth');
      let token: string | undefined;
      if (authCookie) {
        try {
          token = JSON.parse(authCookie).token;
        } catch (e) {
          console.error('Error parsing auth cookie:', e);
        }
      }
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const formData = new FormData();
      formData.append('class', formatGradeForAPI(selectedGrade));
      formData.append('style', selectedStyle.toLowerCase());
      formData.append('prompt', inputValue.trim());
      formData.append('image', outboundImageFile); // ensure file present

      const res = await fetch('/api/vision-chat', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        console.log(res);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const responseText =
        data?.data?.response ||
        data?.response ||
        "Sorry, I couldn't process your request.";

      // Token/Model Logging
      const model = 'Gemini 1.0 Pro';
      const inputTokens = encode(inputValue.trim()).length;
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

      // Add AI message and trigger streaming
      setChatHistory((prev) => {
        const newHistory = [
          ...prev,
          { role: 'ai' as const, text: responseText },
        ];
        setStreamingMessageIndex(newHistory.length - 1);
        setIsStreaming(true);
        return newHistory;
      });

      // OpenAI TTS playback via our API
      try {
        setIsSpeaking(true);
        const ttsRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: responseText,
            voice: 'alloy',
            format: 'mp3',
          }),
        });
        if (ttsRes.ok) {
          const blob = await ttsRes.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          await new Promise<void>((resolve) => {
            audio.onended = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            audio.play();
          });
        }
      } catch (e) {
        console.error('TTS playback error', e);
      } finally {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error('API Error:', err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'ai' as const,
          text: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setApiLoading(false);
      setThinking(false);
      setInputValue('');
      resetTranscript();
    }
  }, [selectedGrade, selectedStyle, inputValue, resetTranscript]);
  console.log(isImageConfirmed, 'isImageConfirmed');

  // Enhanced stop listening with error handling and auto-submit
  const handleStopListening = useCallback(() => {
    try {
      SpeechRecognition.stopListening();
      setSpeechError(null);

      // Auto-submit if we have transcript and required selections
      if (transcript.trim() && selectedGrade && selectedStyle) {
        setInputValue(transcript.trim());
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

  // useEffect(() => {
  //   if (!listening) {
  //     handleSend();
  //     setThinking(false); // reset thinking after sending
  //   }
  // }, [listening, transcript, thinking]);

  // Enhanced start listening with permission and error handling
  const handleStartListening = useCallback(async () => {
    try {
      setSpeechError(null);
      activeSessionRef.current = true;

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
        continuous: true,
        language: 'en-US',
      });

      // If screen sharing and no image captured yet, grab one immediately
      if (!imageFile && screenShareStream) {
        const f = await captureScreenFrameToFile();
        if (f) {
          setImageFile(f);
          setImage(URL.createObjectURL(f));
          setIsImageConfirmed(true);
        }
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setSpeechError('Failed to start voice recognition. Please try again.');
    }
  }, [microphonePermission, resetTranscript]);

  // Typewriter effect for streaming chat messages
  useEffect(() => {
    if (streamingMessageIndex !== null && isStreaming) {
      const message = chatHistory[streamingMessageIndex];
      if (message && message.role === 'ai') {
        const words = message.text.split(' ');
        let currentIndex = 0;
        setDisplayedText('');

        const interval = setInterval(() => {
          if (currentIndex < words.length) {
            setDisplayedText((prev) => {
              const newText =
                currentIndex === 0
                  ? words[0]
                  : prev + ' ' + words[currentIndex];
              return newText;
            });
            currentIndex++; // ✅ Corrected line
          } else {
            setIsStreaming(false);
            setStreamingMessageIndex(null);
            clearInterval(interval);
          }
        }, 40);

        return () => clearInterval(interval);
      }
    }
  }, [streamingMessageIndex, isStreaming, chatHistory]);

  // Maintain session loop to recapture screen frame and send on pauses
  useEffect(() => {
    if (!activeSessionRef.current) return;
    let interval: any;
    if (isScreenSharing) {
      interval = setInterval(async () => {
        // If not currently listening but session active, keep listening
        if (!listening) {
          try {
            await SpeechRecognition.startListening({
              continuous: true,
              language: 'en-US',
            });
          } catch {}
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isScreenSharing, listening]);

  // When transcript changes, update inputValue
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // Auto-send when a phrase likely completes (basic heuristic) and we have an image or screen share
  useEffect(() => {
    if (!activeSessionRef.current) return;

    if (!transcript || transcript.trim().length < 3) return;

    const trimmed = transcript.trim();
    const endsWithPunct = /[\.\?\!\)]$/.test(trimmed);

    if (imageFile || screenShareStream) {
      // debounce send a bit
      const t = setTimeout(() => {
        setInputValue(trimmed);
        handleSend();
        resetTranscript();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [transcript, imageFile, screenShareStream, handleSend, resetTranscript]);

  // === START: History Functions ===
  const fetchHistoryData = async () => {
    console.log('🔍 [HISTORY] Starting to fetch history data...');
    setHistoryLoading(true);

    try {
      const history = await fetchHistory();
      setHistoryData(history);
    } catch (err) {
      console.error('🔍 [HISTORY] Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleHistoryClick = () => {
    console.log('🔍 [HISTORY] View history button clicked');
    setShowHistorySlider(true);
    setIsClosing(false);
    fetchHistoryData();
  };

  const handleCloseHistory = () => {
    console.log('🔍 [HISTORY] Closing history slider');
    setIsClosing(true);
    setTimeout(() => {
      setShowHistorySlider(false);
      setIsClosing(false);
    }, 300);
  };

  const handleViewChat = async (chatId: string, chatTitle: string) => {
    console.log('🔍 [HISTORY] View chat clicked for:', chatId, chatTitle);

    try {
      // Find the chat in history data to get the messages
      const chatItem = historyData.find((item) => item.id === chatId);
      console.log('🔍 [HISTORY] Found chat item:', chatItem);

      if (
        chatItem &&
        chatItem.messages &&
        Array.isArray(chatItem.messages) &&
        chatItem.messages.length > 0
      ) {
        console.log('🔍 [HISTORY] Messages found:', chatItem.messages.length);

        // Convert the messages to the chat format
        const formattedMessages = chatItem.messages.map(
          (msg: unknown, index: number) => {
            // Type guard to ensure msg has the expected structure
            if (
              typeof msg === 'object' &&
              msg !== null &&
              'role' in msg &&
              'content' in msg
            ) {
              const typedMsg = msg as { role: string; content: string };
              console.log(
                `🔍 [HISTORY] Processing message ${index}:`,
                typedMsg
              );

              const role = typedMsg.role === 'USER' ? 'user' : 'ai';
              const text = typedMsg.content || '';

              console.log(
                `🔍 [HISTORY] Message ${index} - Role: ${role}, Text: ${text}`
              );

              return {
                role: role as 'user' | 'ai',
                text: text,
              };
            } else {
              console.warn(
                `🔍 [HISTORY] Invalid message format at index ${index}:`,
                msg
              );
              return {
                role: 'ai' as const,
                text: 'Invalid message format',
              };
            }
          }
        );

        console.log(
          '🔍 [HISTORY] Final formatted messages:',
          formattedMessages
        );

        // Set the chat history and close the slider
        setChatHistory(formattedMessages);
        setSelectedChatId(chatId);
        handleCloseHistory();

        // Scroll to the chat area
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        console.log('🔍 [HISTORY] No messages found. Chat item:', chatItem);
        console.log('🔍 [HISTORY] Messages property:', chatItem?.messages);
        console.log(
          '🔍 [HISTORY] Is messages array:',
          Array.isArray(chatItem?.messages)
        );
        console.log(
          '🔍 [HISTORY] Messages length:',
          chatItem?.messages?.length
        );

        // If no messages found, show an alert
        alert(
          `No messages found for this chat: ${chatTitle}. Please check the console for details.`
        );
      }
    } catch (error) {
      console.error('🔍 [HISTORY] Error loading chat:', error);
      alert('Error loading chat messages');
    }
  };

  const handleSearchChats = () => {
    console.log('🔍 [HISTORY] Search chats button clicked');
    setIsSearching(true);
    setSearchQuery('');
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    console.log('🔍 [HISTORY] Search query:', query);
  };
  // === END: History Functions ===

  // Floating selectors component
  const FloatingSelectors = (
    <div>
      {/* Outer flex holding gradient box and history button */}
      <div
        className='fixed z-40 flex flex-row items-center gap-[10px] right-32 sm:right-36 lg:right-44'
        style={{ top: '40px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Class & Persona selectors inside gradient */}
        <div
          className='flex flex-row gap-3 p-4 rounded-xl'
          style={{
            background:
              'linear-gradient(90deg, rgba(255, 159, 39, 0.08) 0%, rgba(255, 81, 70, 0.08) 100%)',
          }}
        >
          {[
            {
              label: 'Class',
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
              label: 'Persona',
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
              renderOption: (style: StyleOption) => (
                <div className='flex items-center gap-3 cursor-pointer'>
                  {typeof style === 'string' ? style : style.label}
                </div>
              ),
            },
          ].map(
            (
              {
                label,
                value,
                onClick,
                options,
                showDropdown,
                onSelect,
                renderOption,
              },
              i
            ) => (
              <div key={i} className='relative dropdown-container'>
                <button
                  className={`flex items-center transition-all duration-150 rounded-lg px-3 py-2 min-w-[120px] sm:min-w-[140px] justify-between ${
                    value
                      ? 'point-ask-gradient text-white shadow-md'
                      : 'bg-white/80 hover:bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={onClick}
                >
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium whitespace-nowrap flex items-center'>
                      <span className='mr-1'>{label}:</span>
                      <span className='font-semibold'>{value || 'Select'}</span>
                      <ChevronDownIcon className='ml-2 size-4 shrink-0' />
                    </span>
                  </div>
                </button>

                {showDropdown && (
                  <div className='absolute mt-2 z-10 bg-white rounded-lg shadow-lg max-h-[300px] overflow-y-auto w-full border border-gray-100 dropdown-container'>
                    {/* Header */}
                    <div className='bg-gray-100 px-4 py-3 rounded-t-lg border-b border-gray-200'>
                      <span className='text-sm font-medium text-gray-700'>
                        Select {label}
                      </span>
                    </div>
                    {/* Options */}
                    {options.map((opt: OptionType) => {
                      const key = isOptionWithIcon(opt) ? opt.label : opt;
                      const value = isOptionWithIcon(opt) ? opt.value : opt;

                      return (
                        <div
                          key={key}
                          className='px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-b-0 transition-colors duration-150'
                          onClick={() => onSelect(value)}
                        >
                          {isOptionWithIcon(opt) && renderOption
                            ? renderOption(opt)
                            : key}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* View History Button outside gradient */}
        <button
          onClick={handleHistoryClick}
          className='rounded-full px-4 py-2 bg-[#FFE4B5] border border-[#FF5146] text-[#FF5146] hover:bg-[#FFDAB9] transition-all duration-150 flex items-center gap-2 min-w-[120px] justify-center shadow-sm'
        >
          <img src='/images/history.svg' alt='history' className='w-4 h-4' />
          <span className='text-sm font-medium'>View history</span>
        </button>
      </div>
    </div>
  );

  return (
    // <div
    //   className='min-h-screen flex flex-col items-center justify-center relative'
    //   style={{
    //     backgroundSize: 'cover',
    //     backgroundPosition: 'center',
    //   }}
    // >
    //   {FloatingSelectors}

    //   {/* History Slider */}
    //   <HistorySlider
    //     showHistorySlider={showHistorySlider}
    //     isClosing={isClosing}
    //     historyData={historyData}
    //     historyLoading={historyLoading}
    //     searchQuery={searchQuery}
    //     isSearching={isSearching}
    //     onClose={handleCloseHistory}
    //     onSearchClick={handleSearchChats}
    //     onSearchInputChange={handleSearchInputChange}
    //     onSearchClose={() => {
    //       setIsSearching(false);
    //       setSearchQuery('');
    //     }}
    //     onNewChat={() => {
    //       console.log('🔍 [HISTORY] New chat button clicked');
    //       handleCloseHistory();
    //       setSelectedChatId(null);
    //       setChatHistory([]);
    //       setImage(null);
    //       setImageFile(null);
    //       setIsImageConfirmed(false);
    //     }}
    //     onViewChat={handleViewChat}
    //   />

    //   <div className='w-full px-4 lg:px-8 mt-6'>
    //     {/* Welcome message and suggestions - only show before chat starts */}
    //     {!image && chatHistory.length === 0 && (
    //       <div className=' flex flex-col mt-12 items-center max-w-4xl mx-auto'>
    //         <div className='mt-24 mb-4 text-center w-full'>
    //           <div className='text-2xl md:text-3xl font-bold text-black mb-2'>
    //             <span role='img' aria-label='wave'>
    //               👋
    //             </span>{' '}
    //             Upload a question image to get started!
    //             {selectedStyle ? 'like a ' + selectedStyle : ''}{' '}
    //             {selectedGrade
    //               ? selectedGrade === 'UG' || selectedGrade === 'PG'
    //                 ? ` for ${selectedGrade} level`
    //                 : ' for Grade ' + selectedGrade.replace(/\D/g, '')
    //               : ''}
    //           </div>
    //           <div className='text-lg text-black mb-8'>
    //             Select your class and style, then upload a photo of your
    //             question.
    //           </div>
    //         </div>
    //         <div className='flex flex-col md:flex-row gap-8 w-full justify-center mb-8'>
    //           <button
    //             className='flex items-center justify-center gap-4 rounded-xl px-8 py-6 text-lg font-medium bg-transparent text-black w-full md:w-1/2 border border-[#007437]/30'
    //             onClick={() => fileInputRef.current?.click()}
    //           >
    //             <span className='point-ask-gradient rounded-full w-12 h-12 flex items-center justify-center'>
    //               <svg
    //                 width='28'
    //                 height='28'
    //                 fill='none'
    //                 stroke='#fff'
    //                 strokeWidth='2'
    //                 viewBox='0 0 24 24'
    //               >
    //                 <rect x='3' y='7' width='18' height='13' rx='2' />
    //                 <path d='M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
    //               </svg>
    //             </span>
    //             Upload Image
    //             <input
    //               ref={fileInputRef}
    //               type='file'
    //               accept='image/*'
    //               className='hidden'
    //               onChange={(e) => {
    //                 if (e.target.files && e.target.files[0]) {
    //                   handleImageUpload(e.target.files[0]);
    //                 }
    //               }}
    //             />
    //           </button>

    //           {/* Share Screen Button */}
    //           <button
    //             className='flex items-center justify-center gap-4 rounded-xl px-8 py-6 text-lg font-medium bg-transparent text-black w-full md:w-1/2 border border-[#FF5146]/30'
    //             onClick={() =>
    //               isScreenSharing ? stopScreenShare() : startScreenShare()
    //             }
    //           >
    //             <span className='point-ask-gradient rounded-full w-12 h-12 flex items-center justify-center'>
    //               <svg
    //                 width='28'
    //                 height='28'
    //                 viewBox='0 0 24 24'
    //                 fill='none'
    //                 stroke='#fff'
    //                 strokeWidth='2'
    //               >
    //                 <rect x='3' y='4' width='18' height='12' rx='2' />
    //                 <path d='M7 20h10M12 16v4' />
    //               </svg>
    //             </span>
    //             {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
    //           </button>
    //         </div>

    //         {screenShareError && (
    //           <div className='text-red-500 mb-4'>{screenShareError}</div>
    //         )}

    //         {/* Live screen preview and capture controls */}
    //         {isScreenSharing && (
    //           <div className='w-full flex flex-col items-center gap-4 mb-8'>
    //             <video
    //               ref={screenVideoRef}
    //               autoPlay
    //               muted
    //               playsInline
    //               className='rounded-xl border w-full sm:w-[600px] max-w-full bg-black'
    //             />
    //             <div className='flex gap-3'>
    //               <button
    //                 className='point-ask-gradient text-white rounded-lg px-6 py-2'
    //                 onClick={captureScreenFrame}
    //               >
    //                 Capture Frame
    //               </button>
    //               <button
    //                 className='bg-gray-800 text-white rounded-lg px-6 py-2'
    //                 onClick={stopScreenShare}
    //               >
    //                 Stop Sharing
    //               </button>
    //             </div>
    //           </div>
    //         )}
    //       </div>
    //     )}
    //     {(image || isScreenSharing) && !thinking && (
    //       <div className='pt-24'>
    //         {/* Compact image preview when image is uploaded but no response yet */}

    //         <div className='w-full flex flex-col items-center mb-6'>
    //           {image && (
    //             <div className='rounded-2xl overflow-hidden bg-black w-full sm:w-[600px] max-w-full h-[300px] sm:h-[300px] flex items-center justify-center mb-4'>
    //               <img
    //                 src={image}
    //                 alt='Uploaded question'
    //                 className='object-cover w-full h-full'
    //               />
    //             </div>
    //           )}
    //           {isScreenSharing && !image && (
    //             <div className='rounded-2xl overflow-hidden bg-black w-full sm:w-[600px] max-w-full h-[300px] sm:h-[300px] flex items-center justify-center mb-4'>
    //               <video
    //                 ref={screenVideoRef}
    //                 autoPlay
    //                 muted
    //                 playsInline
    //                 className='object-contain w-full h-full'
    //               />
    //             </div>
    //           )}
    //           <div className='flex items-center gap-2 mb-4'>
    //             <span className='text-white font-medium text-lg rounded-lg px-6 py-2 point-ask-gradient'>
    //               {image
    //                 ? 'Image captured'
    //                 : isScreenSharing
    //                 ? 'Screen sharing active'
    //                 : ''}
    //             </span>
    //           </div>
    //           {/* Action buttons */}
    //           {!isImageConfirmed && (
    //             <div className='flex gap-[5.3px]'>
    //               {/* Use this */}
    //               <button
    //                 className='text-white font-medium transition-colors flex items-center justify-center'
    //                 style={{
    //                   width: '114.5px',
    //                   height: '89.6px',
    //                   borderRadius: '16.97px',
    //                   backgroundColor: '#3C434B',
    //                 }}
    //                 onClick={() => {
    //                   console.log('use this clicked');

    //                   setIsImageConfirmed(true);
    //                   const chatInput = document.querySelector(
    //                     'input[placeholder="Type your question..."]'
    //                   ) as HTMLInputElement;
    //                   if (chatInput) {
    //                     chatInput.focus();
    //                     chatInput.scrollIntoView({
    //                       behavior: 'smooth',
    //                       block: 'center',
    //                     });
    //                   }
    //                   // ✅ Confirm image
    //                 }}
    //               >
    //                 <div className='flex flex-col items-center gap-2'>
    //                   {/* [Icon omitted for brevity] */}
    //                   <img src='/images/usethis.svg' alt='' />
    //                   <span className='text-sm'>Use this</span>
    //                 </div>
    //               </button>
    //               <button
    //                 className='text-white font-medium transition-colors flex items-center justify-center'
    //                 style={{
    //                   width: '114.5px',
    //                   height: '89.6px',
    //                   borderRadius: '16.97px',
    //                   backgroundColor: '#3C434B',
    //                 }}
    //                 onClick={() => {
    //                   setImage(null);
    //                   setImageFile(null);
    //                   setIsImageConfirmed(false); // ❌ Reset confirmation
    //                   if (fileInputRef.current) {
    //                     fileInputRef.current.value = '';
    //                   }
    //                 }}
    //               >
    //                 <div className='flex flex-col items-center gap-2'>
    //                   {/* [Icon omitted for brevity] */}
    //                   <img src='/images/retake.svg' alt='' />
    //                   <span className='text-sm'>Retake</span>
    //                 </div>
    //               </button>
    //             </div>
    //           )}
    //         </div>
    //       </div>
    //     )}

    //     {/* Chat area - only show after chat starts */}
    //     {chatHistory.length > 0 && (
    //       <div className='pb-32 max-w-4xl mx-auto'>
    //         <div className='w-full flex flex-col gap-3'>
    //           {chatHistory.map((msg, idx) => (
    //             <div
    //               key={idx}
    //               className={`flex ${
    //                 msg.role === 'user' ? 'justify-end' : 'justify-start'
    //               }`}
    //             >
    //               {msg.role === 'user' ? (
    //                 <div className='max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 point-ask-gradient text-white'>
    //                   <p className='text-sm md:text-base leading-relaxed'>
    //                     {msg.text}
    //                   </p>
    //                 </div>
    //               ) : (
    //                 <div className='max-w-[85%] md:max-w-[75%]'>
    //                   <AIMessage text={msg.text} />
    //                 </div>
    //               )}
    //             </div>
    //           ))}
    //           {thinking && (
    //             <div className='flex justify-start'>
    //               <div className='bg-[rgba(34,34,34,0.9)] text-white rounded-2xl px-5 py-3 border border-[#007437]/20 opacity-70'>
    //                 <p className='text-sm md:text-base'>Thinking...</p>
    //               </div>
    //             </div>
    //           )}
    //           <div ref={chatBottomRef} />
    //         </div>
    //       </div>
    //     )}
    //   </div>

    //   {/* Only show input bar if both selectors are chosen */}
    //   {/* {selectedGrade && selectedStyle && <MicInputBar />} */}
    //   <div className='flex items-center justify-center mb-8'>
    //     {(listening || isSpeaking) && (
    //       <SpruceBall listening={listening || isSpeaking} />
    //     )}
    //   </div>

    //   <div className='mb-8'>
    //     {(isImageConfirmed || isScreenSharing) && (
    //       <div className='flex gap-3 justify-center mb-8'>
    //         <button
    //           onClick={handleStartListening}
    //           className='point-ask-gradient cursor-pointer hover:bg-red-600 text-white px-8 py-3 rounded-full ...'
    //         >
    //           {/* mic icon SVG */}
    //           Start Speaking
    //         </button>
    //       </div>
    //     )}
    //   </div>
    // </div>

    <div className='min-h-screen flex flex-col items-center justify-center'>
      <h1 className='text-6xl font-bold text-[#FF8C00]'>Coming Soon</h1>
    </div>
  );
}
