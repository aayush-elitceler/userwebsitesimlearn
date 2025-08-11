"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Cookies from "js-cookie";
import { ArrowRight, ChevronDownIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { encode } from "gpt-tokenizer";
import SpruceBall from "@/components/SpruceBall";
import { fetchHistory, HistoryItem } from "@/lib/historyService";
import HistorySlider from "@/components/HistorySlider";

const grades = [
  "1st grade",
  "2nd grade",
  "3rd grade",
  "4th grade",
  "5th grade",
  "6th grade",
  "7th grade",
  "8th grade",
  "9th grade",
  "10th grade",
  "11th grade",
  "12th grade",
  "UG",
  "PG",
];

type StyleOption = {
  label: string;
  value: string;
  [key: string]: unknown; // If it might have more props
};
type OptionWithIcon = {
  label: string;
  value: string;
  icon: React.JSX.Element;
};

type OptionType = string | OptionWithIcon;

const isOptionWithIcon = (opt: OptionType): opt is OptionWithIcon =>
  typeof opt === "object" && "label" in opt && "value" in opt;

// Helper function to format grade for API calls
const formatGradeForAPI = (grade: string): string => {
  if (grade === "UG") return "UG";
  if (grade === "PG") return "PG";
  return grade.replace(/\D/g, ""); // Extract numbers for regular grades
};

const styles = [
  {
    label: "Professor",
    value: "professor",
    icon: (
      <span className="point-ask-gradient rounded-full w-10 h-10 flex items-center justify-center mr-4">
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 15c1.333-1 4.667-1 6 0" />
          <rect x="7" y="9" width="10" height="4" rx="2" />
          <path d="M9 9V7a3 3 0 0 1 6 0v2" />
        </svg>
      </span>
    ),
  },
  {
    label: "Friend",
    value: "friend",
    icon: (
      <span className="point-ask-gradient rounded-full w-10 h-10 flex items-center justify-center mr-4">
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" />
        </svg>
      </span>
    ),
  },
  {
    label: "Robot",
    value: "robot",
    icon: (
      <span className="point-ask-gradient rounded-full w-10 h-10 flex items-center justify-center mr-4">
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect x="4" y="8" width="16" height="8" rx="4" />
          <circle cx="8" cy="12" r="1.5" />
          <circle cx="16" cy="12" r="1.5" />
        </svg>
      </span>
    ),
  },
];

const suggestions = [
  "What is gravity and why don't we float like astronauts?",
  "How do plants make their own food using sunlight and water?",
  "How do plants make their own food using sunlight and water?",
  "How do plants make their own food using sunlight and water?",
];

export default function ImprovedAiChatsVoicePage() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);

  // Speech recognition state
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const [inputValue, setInputValue] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [displayedText, setDisplayedText] = useState<string>("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const lastSentTranscriptRef = useRef("");

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // === START: New Onboarding Code ===
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Always show onboarding on page refresh, regardless of cookie
    setShowOnboarding(true);
  }, []);

  useEffect(() => {
    if (showOnboarding) {
      const timer = setTimeout(() => {
        setShowOnboarding(false);
        Cookies.set("hasVisited", "true", { expires: 365 });
      }, 2000); // 2-second delay
      return () => clearTimeout(timer);
    }
  }, [showOnboarding]);
  // === END: New Onboarding Code ===

  // === START: History Slider State ===
  const [showHistorySlider, setShowHistorySlider] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  // === END: History Slider State ===

  // Check browser support and microphone permission on mount
  useEffect(() => {
    const checkPermissions = async () => {
      // Check if HTTPS is being used
      if (
        typeof window !== "undefined" &&
        window.location.protocol !== "https:" &&
        window.location.hostname !== "localhost"
      ) {
        setSpeechError("Voice recognition requires HTTPS connection");
        return;
      }

      // Check browser support
      if (!browserSupportsSpeechRecognition) {
        setSpeechError("Your browser does not support speech recognition");
        return;
      }

      // Check microphone permission
      try {
        const permission = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        setMicrophonePermission(permission.state);

        permission.addEventListener("change", () => {
          setMicrophonePermission(permission.state);
        });
      } catch (error) {
        console.error("Error checking microphone permission:", error);
        // Fallback for browsers that don't support permissions API
        setMicrophonePermission("unknown");
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
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, thinking, aiSpeaking, displayedText]);

  // Send message to API with better error handling and speech synthesis integration
  const handleSend = useCallback(async () => {
    console.log('[DEBUG] handleSend called with transcript:', transcript.trim());
    if (!selectedGrade || !selectedStyle || !transcript.trim()) return;

    setApiLoading(true);
    setThinking(true);
    // Store user message temporarily but don't add to chat history yet
    const userMessage = transcript.trim();

    try {
      const authCookie = Cookies.get("auth");
      let token: string | undefined;
      if (authCookie) {
        try {
          token = JSON.parse(authCookie).token;
        } catch (e) {
          console.error("Error parsing auth cookie:", e);
        }
      }

      console.log('[DEBUG] handleSend API call payload:', {
        class: formatGradeForAPI(selectedGrade),
        style: selectedStyle.toLowerCase(),
        message: userMessage,
        ...(sessionId && { sessionId }), // Include sessionId if it exists
      });

      const res = await fetch(
        "https://apisimplylearn.selflearnai.in/api/v1/ai/voice-chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            class: formatGradeForAPI(selectedGrade),
            style: selectedStyle.toLowerCase(),
            message: userMessage,
            ...(sessionId && { sessionId }), // session id
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const responseText =
        data?.data?.response || "Sorry, I couldn't process your request.";
      
      // Extract and store sessionId from response if it exists
      if (data?.data?.sessionId) {
        setSessionId(data.data.sessionId);
      }

      // Token/Model Logging
      const model = "Gemini 1.0 Pro";
      const inputTokens = encode(userMessage).length;
      const outputTokens = encode(responseText).length;
      const inputPricePer1K = 0.002;
      const outputPricePer1K = 0.006;
      const inputCost = (inputTokens / 1000) * inputPricePer1K;
      const outputCost = (outputTokens / 1000) * outputPricePer1K;
      const totalCost = inputCost + outputCost;

      console.log("--- AI Chat Log ---");
      console.log("Model:", model);
      console.log("Input tokens:", inputTokens);
      console.log("Output tokens:", outputTokens);
      console.log("Input cost:", inputCost.toFixed(6));
      console.log("Output cost:", outputCost.toFixed(6));
      console.log("Total cost:", totalCost.toFixed(6));

      // Start speech synthesis immediately - this implements the ChatGPT-like behavior
      // where the assistant starts speaking immediately after the user stops
      setAiSpeaking(true);
      console.log('[DEBUG] TTS utterance will start:', responseText);
      
      // Create and configure speech synthesis based on selected persona
      const utterance = new SpeechSynthesisUtterance(responseText);
      
      // Configure voice characteristics based on selected persona
      const configureVoiceForPersona = (style: string) => {
        const voices = window.speechSynthesis.getVoices();
        
        // Smart voice selection function that analyzes available voices
        const findBestVoiceForPersona = (persona: string) => {
          if (!voices || voices.length === 0) return null;
          
          const englishVoices = voices.filter(v => v.lang.startsWith("en"));
          if (englishVoices.length === 0) return voices[0]; // Fallback to any voice
          
          switch (persona.toLowerCase()) {
            case 'professor':
              // Professor: Look for authoritative, mature, male-sounding voices
              const professorCandidates = englishVoices.filter(v => {
                const name = v.name.toLowerCase();
                // Priority 1: Classic male names
                if (name.includes("david") || name.includes("alex") || name.includes("mark") || 
                    name.includes("james") || name.includes("john") || name.includes("michael") ||
                    name.includes("robert") || name.includes("william") || name.includes("thomas") ||
                    name.includes("daniel") || name.includes("paul") || name.includes("tom")) {
                  return true;
                }
                // Priority 2: Male indicators
                if (name.includes("male")) return true;
                // Priority 3: Authoritative sounding names
                if (name.includes("authority") || name.includes("professor") || name.includes("teacher")) return true;
                return false;
              });
              
              // Return the first match or fallback to a deep-sounding voice
              if (professorCandidates.length > 0) return professorCandidates[0];
              
              // Fallback: Look for voices that might sound authoritative
              const fallbackProfessor = englishVoices.find(v => 
                v.name.toLowerCase().includes("us") || v.name.toLowerCase().includes("english")
              );
              return fallbackProfessor || englishVoices[0];
              
            case 'friend':
              // Friend: Look for warm, friendly, approachable voices
              const friendCandidates = englishVoices.filter(v => {
                const name = v.name.toLowerCase();
                // Priority 1: Classic friendly female names
                if (name.includes("samantha") || name.includes("ava") || name.includes("victoria") ||
                    name.includes("karen") || name.includes("lisa") || name.includes("sarah") ||
                    name.includes("emma") || name.includes("olivia") || name.includes("sophia") ||
                    name.includes("isabella") || name.includes("mia") || name.includes("charlotte") ||
                    name.includes("amelia") || name.includes("zira") || name.includes("eva")) {
                  return true;
                }
                // Priority 2: Female indicators
                if (name.includes("female")) return true;
                // Priority 3: Friendly sounding names
                if (name.includes("friendly") || name.includes("warm") || name.includes("gentle")) return true;
                return false;
              });
              
              // Return the first match or fallback to a warm-sounding voice
              if (friendCandidates.length > 0) return friendCandidates[0];
              
              // Fallback: Look for voices that might sound friendly
              const fallbackFriend = englishVoices.find(v => 
                v.name.toLowerCase().includes("us") || v.name.toLowerCase().includes("english")
              );
              return fallbackFriend || englishVoices[0];
              
            case 'robot':
              // Robot: Look for clear, neutral, systematic voices
              const robotCandidates = englishVoices.filter(v => {
                const name = v.name.toLowerCase();
                // Priority 1: System/Assistant voices
                if (name.includes("system") || name.includes("google") || name.includes("microsoft") ||
                    name.includes("siri") || name.includes("cortana") || name.includes("alexa") ||
                    name.includes("assistant") || name.includes("tts") || name.includes("speech") ||
                    name.includes("voice") || name.includes("neutral") || name.includes("clear")) {
                  return true;
                }
                // Priority 2: Technical sounding names
                if (name.includes("technical") || name.includes("digital") || name.includes("electronic")) return true;
                // Priority 3: Clear pronunciation indicators
                if (name.includes("clear") || name.includes("precise") || name.includes("accurate")) return true;
                return false;
              });
              
              // Return the first match or fallback to a clear-sounding voice
              if (robotCandidates.length > 0) return robotCandidates[0];
              
              // Fallback: Look for voices that might sound clear and systematic
              const fallbackRobot = englishVoices.find(v => 
                v.name.toLowerCase().includes("us") || v.name.toLowerCase().includes("english")
              );
              return fallbackRobot || englishVoices[0];
              
            default:
              // Default: Balanced, natural voice
              return englishVoices.find(v => 
                v.name.toLowerCase().includes("us") || v.name.toLowerCase().includes("english")
              ) || englishVoices[0];
          }
        };
        
        // Apply persona-specific voice configuration
        switch (style.toLowerCase()) {
          case 'professor':
            // Professor: Slower, deeper, more authoritative
            utterance.rate = 0.8;        // Slower speech
            utterance.pitch = 0.9;       // Slightly deeper pitch
            utterance.volume = 1;
            break;
            
          case 'friend':
            // Friend: Normal speed, friendly pitch, warm tone
            utterance.rate = 1.0;        // Normal speed
            utterance.pitch = 1.1;       // Slightly higher, friendly pitch
            utterance.volume = 1;
            break;
            
          case 'robot':
            // Robot: Monotone, slightly faster, robotic feel
            utterance.rate = 1.1;        // Slightly faster
            utterance.pitch = 0.8;       // Lower, more monotone
            utterance.volume = 0.9;      // Slightly lower volume
            break;
            
          default:
            // Default: Balanced settings
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
        }
        
        // Find and set the best voice for the persona
        const bestVoice = findBestVoiceForPersona(style);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      };
      
      // Apply persona-based voice configuration
      configureVoiceForPersona(selectedStyle);
      


      // When speech ends, add both messages to chat history
      // This implements the ChatGPT-like behavior where user messages appear only after AI responds
      utterance.onend = () => {
        setAiSpeaking(false);
        // Now add both messages to chat history
        setChatHistory((prev) => [
          ...prev,
          { role: "user", text: userMessage },
          { role: "ai", text: responseText }
        ]);
        setDisplayedText(""); // Clear the displayed text since it's now in chat history
        resetTranscript(); // clear transcript for next turn
        lastSentTranscriptRef.current = "";
      };

      // If speech fails, still add messages to chat history
      utterance.onerror = () => {
        setAiSpeaking(false);
        setChatHistory((prev) => [
          ...prev,
          { role: "user", text: userMessage },
          { role: "ai", text: responseText }
        ]);
        setDisplayedText(""); // Clear the displayed text
        resetTranscript(); // clear transcript for next turn
        lastSentTranscriptRef.current = "";
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
      
      // Store the response text for display during speech
      setDisplayedText(responseText);
      
    } catch (err) {
      console.error("API Error:", err);
      setAiSpeaking(false);
      // In case of error, add both messages
      setChatHistory((prev) => [
        ...prev,
        { role: "user", text: userMessage },
        {
          role: "ai" as const,
          text: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setApiLoading(false);
      setThinking(false);
      setInputValue("");
      resetTranscript();
    }
  }, [selectedGrade, selectedStyle, transcript, resetTranscript, sessionId]);

  // === START: History Functions ===
  const fetchHistoryData = async () => {
    console.log("🔍 [HISTORY] Starting to fetch history data...");
    setHistoryLoading(true);
    
    try {
      const history = await fetchHistory();
      setHistoryData(history);
    } catch (err) {
      console.error("🔍 [HISTORY] Error fetching history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleHistoryClick = () => {
    console.log("🔍 [HISTORY] View history button clicked");
    setShowHistorySlider(true);
    setIsClosing(false);
    fetchHistoryData();
  };

  const handleCloseHistory = () => {
    console.log("🔍 [HISTORY] Closing history slider");
    setIsClosing(true);
    setTimeout(() => {
      setShowHistorySlider(false);
      setIsClosing(false);
    }, 300);
  };

  const handleViewChat = async (chatId: string, chatTitle: string) => {
    console.log("🔍 [HISTORY] View chat clicked for:", chatId, chatTitle);
    
    try {
      // Find the chat in history data to get the messages
      const chatItem = historyData.find(item => item.id === chatId);
      console.log("🔍 [HISTORY] Found chat item:", chatItem);
      
      if (chatItem && chatItem.messages && Array.isArray(chatItem.messages) && chatItem.messages.length > 0) {
        console.log("🔍 [HISTORY] Messages found:", chatItem.messages.length);
        
        // Convert the messages to the chat format
        const formattedMessages = chatItem.messages.map((msg: unknown, index: number) => {
          // Type guard to ensure msg has the expected structure
          if (typeof msg === 'object' && msg !== null && 'role' in msg && 'content' in msg) {
            const typedMsg = msg as { role: string; content: string };
            console.log(`🔍 [HISTORY] Processing message ${index}:`, typedMsg);
            
            const role = typedMsg.role === 'USER' ? 'user' : 'ai';
            const text = typedMsg.content || '';
            
            console.log(`🔍 [HISTORY] Message ${index} - Role: ${role}, Text: ${text}`);
            
            return {
              role: role as 'user' | 'ai',
              text: text
            };
          } else {
            console.warn(`🔍 [HISTORY] Invalid message format at index ${index}:`, msg);
            return {
              role: 'ai' as const,
              text: 'Invalid message format'
            };
          }
        });
        
        console.log("🔍 [HISTORY] Final formatted messages:", formattedMessages);
        
        // Set the chat history and close the slider
        setChatHistory(formattedMessages);
        setSelectedChatId(chatId);
        handleCloseHistory();
        
        // Scroll to the chat area
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        console.log("🔍 [HISTORY] No messages found. Chat item:", chatItem);
        console.log("🔍 [HISTORY] Messages property:", chatItem?.messages);
        console.log("🔍 [HISTORY] Is messages array:", Array.isArray(chatItem?.messages));
        console.log("🔍 [HISTORY] Messages length:", chatItem?.messages?.length);
        
        // If no messages found, show an alert
        alert(`No messages found for this chat: ${chatTitle}. Please check the console for details.`);
      }
    } catch (error) {
      console.error("🔍 [HISTORY] Error loading chat:", error);
      alert("Error loading chat messages");
    }
  };

  const handleSearchChats = () => {
    console.log("🔍 [HISTORY] Search chats button clicked");
    setIsSearching(true);
    setSearchQuery("");
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    console.log("🔍 [HISTORY] Search query:", query);
  };
  // === END: History Functions ===

  // Auto-detect end of user speech and trigger assistant reply
  useEffect(() => {
    console.log('[DEBUG] useEffect check:', {
      isConversationActive,
      listening,
      transcript,
      aiSpeaking,
      thinking,
      apiLoading,
      lastSentTranscript: lastSentTranscriptRef.current
    });
    if (
      isConversationActive &&
      !listening &&
      transcript.trim() &&
      !aiSpeaking &&
      !thinking &&
      !apiLoading &&
      transcript.trim() !== lastSentTranscriptRef.current
    ) {
      console.log('[DEBUG] useEffect will call handleSend for transcript:', transcript.trim());
      lastSentTranscriptRef.current = transcript.trim();
      handleSend();
    }
  }, [isConversationActive, listening, transcript, aiSpeaking, thinking, apiLoading, handleSend]);

  // After assistant finishes, auto-restart listening for next user input
  useEffect(() => {
    if (
      isConversationActive &&
      !aiSpeaking &&
      !thinking &&
      !apiLoading &&
      transcript.trim() === ""
    ) {
      // Only restart listening if not already listening
      if (!listening) {
        SpeechRecognition.startListening({
          continuous: false,
          language: "en-US",
        });
      }
    }
  }, [isConversationActive, aiSpeaking, thinking, apiLoading, transcript, listening]);

  // Enhanced start listening with permission and error handling
  const handleStartListening = useCallback(async () => {
    try {
      setSpeechError(null);

      // Check microphone permission first
      if (microphonePermission === "denied") {
        setSpeechError(
          "Microphone access denied. Please enable microphone permissions in your browser settings."
        );
        return;
      }

      // Request microphone access explicitly
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permissionError) {
        console.error("Microphone permission error:", permissionError);
        setSpeechError("Please allow microphone access to use voice input");
        return;
      }

      resetTranscript();

      // Start listening with enhanced options
      await SpeechRecognition.startListening({
        continuous: false,
        language: "en-US",
      });
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setSpeechError("Failed to start voice recognition. Please try again.");
    }
  }, [microphonePermission, resetTranscript]);

  // Start continuous conversation
  const startConversation = useCallback(async () => {
    try {
      setSpeechError(null);
      setIsConversationActive(true);
      if (microphonePermission === "denied") {
        setSpeechError(
          "Microphone access denied. Please enable microphone permissions in your browser settings."
        );
        setIsConversationActive(false);
        return;
      }
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permissionError) {
        console.error("Microphone permission error:", permissionError);
        setSpeechError("Please allow microphone access to use voice input");
        setIsConversationActive(false);
        return;
      }
      resetTranscript();
      await SpeechRecognition.startListening({
        continuous: false, // single utterance
        language: "en-US",
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      setSpeechError("Failed to start conversation. Please try again.");
      setIsConversationActive(false);
    }
  }, [microphonePermission, resetTranscript]);

  // Stop conversation
  const stopConversation = useCallback(() => {
    try {
      SpeechRecognition.stopListening();
      setIsConversationActive(false);
      setSpeechError(null);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Immediately stop any ongoing TTS
      }
      // Reset sessionId when conversation ends
      setSessionId(null);
      // Do NOT trigger handleSend or TTS for any remaining transcript
      // Only show chat bubbles for chatHistory
    } catch (error) {
      console.error("Error stopping conversation:", error);
      setSpeechError("Failed to stop conversation");
    }
  }, [setIsConversationActive, setSpeechError]);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When transcript changes, update inputValue
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // Suggestion click handler
  const handleSuggestion = (s: string) => {
    if (!selectedGrade || !selectedStyle) {
      setInputValue(s);
    } else {
      setInputValue(s);
      setTimeout(() => handleSend(), 100);
    }
  };



  // Floating selectors component
  const FloatingSelectors = (
    <div>
      {/* Outer flex to hold both colored box and history button */}
      <div
        className="absolute z-40 flex flex-row items-center gap-[10px] right-32 sm:right-36 lg:right-44"
        style={{ top: "40px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colored gradient box for Class & Persona */}
        <div
          className={`flex flex-row gap-3 p-4 rounded-xl transition-all duration-300 ${
            showOnboarding ? "z-[60] shadow-2xl" : ""
          }`}
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
              label: "Persona",
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
                <div className="flex items-center gap-3 cursor-pointer">
                  {typeof style === "string" ? style : style.label}
                </div>
              ),
            },
          ].map(
            ({ label, value, onClick, options, showDropdown, onSelect, renderOption }, i) => (
              <div key={i} className="relative dropdown-container">
                <button
                  className={`flex items-center transition-all duration-150 rounded-lg px-3 py-2 min-w-[120px] sm:min-w-[140px] justify-between ${
                    value
                      ? "point-ask-gradient text-white shadow-md"
                      : "bg-white/80 hover:bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={onClick}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium whitespace-nowrap flex items-center">
                      <span className="mr-1">{label}:</span>
                      <span className="font-semibold">{value || "Select"}</span>
                      <ChevronDownIcon className="ml-2 size-4 shrink-0" />
                    </span>
                  </div>
                </button>
  
                {showDropdown && (
                  <div className="absolute mt-2 z-10 bg-white rounded-lg shadow-lg max-h-[300px] overflow-y-auto w-full border border-gray-100 dropdown-container">
                    {/* Header */}
                    <div className="bg-gray-100 px-4 py-3 rounded-t-lg border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-700">Select {label}</span>
                    </div>
                    {/* Options */}
                    {options.map((opt: OptionType) => {
                      const key = isOptionWithIcon(opt) ? opt.label : opt;
                      const value = isOptionWithIcon(opt) ? opt.value : opt;

                      return (
                        <div
                          key={key}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-b-0 transition-colors duration-150"
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
        

  
        {/* View History Button (outside gradient) */}
        <button
          onClick={handleHistoryClick}
          className="rounded-full px-3 py-2 bg-[#FFE4B5] border border-[#FF5146] text-[#FF5146] hover:bg-[#FFDAB9] transition-all duration-150 flex items-center gap-2 min-w-[120px] justify-center shadow-sm"
        >
          <img
            src="/images/history.svg"
            alt="history"
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">View history</span>
        </button>
        

      </div>
    </div>
  );
  

  // Enhanced MicInputBar with error display
  function MicInputBar() {
    const hideSidebar =
      pathname === "/login" ||
      pathname === "/login/otp" ||
      pathname === "/register";
    const sidebarCollapsed = state === "collapsed";
    const inputBarClass = `fixed bottom-2 sm:bottom-4 z-50 px-2 sm:px-4 flex items-center gap-2 sm:gap-3 bg-[rgba(255,255,255,0.1)] py-2 sm:py-3 max-w-5xl mx-auto input-bar-responsive ${
      hideSidebar ? "" : sidebarCollapsed ? "sidebar-collapsed" : ""
    }`;

    const canUseMicrophone =
      browserSupportsSpeechRecognition &&
      microphonePermission !== "denied" &&
      !speechError &&
      selectedGrade &&
      selectedStyle;

    return (
      <>
        {/* Error message display */}
        {speechError && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-md text-center">
            {speechError}
          </div>
        )}

        <div
          className={inputBarClass}
          style={{
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            border: "0.96px solid rgba(255,255,255,0.2)",
            height: "55px",
          }}
        >
          <button
            className={`rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl ${
              listening
                ? "point-ask-gradient text-black"
                : canUseMicrophone
                ? "bg-[#4A4A4A] text-white hover:bg-[#5A5A5A]"
                : "bg-gray-400 text-gray-600 cursor-not-allowed"
            } transition min-w-[40px] sm:min-w-[48px]`}
            onClick={handleStartListening}
            disabled={listening || thinking || apiLoading || !canUseMicrophone}
            title={
              !browserSupportsSpeechRecognition
                ? "Speech recognition not supported"
                : microphonePermission === "denied"
                ? "Microphone access denied"
                : speechError
                ? speechError
                : !selectedGrade || !selectedStyle
                ? "Please select grade and style first"
                : "Click to start voice input (auto-submits when done)"
            }
          >
            <svg
              width="20"
              height="20"
              className="sm:hidden"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
              <path d="M12 19v3m-4 0h8" />
            </svg>
            <svg
              width="28"
              height="28"
              className="hidden sm:block"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
              <path d="M12 19v3m-4 0h8" />
            </svg>
          </button>
          {/* <button
            className="rounded-lg p-2 sm:p-3 point-ask-gradient text-white disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center min-w-[40px] sm:min-w-[48px]"
            onClick={handleSend}
            disabled={
              !inputValue.trim() ||
              apiLoading ||
              thinking ||
              !selectedGrade ||
              !selectedStyle
            }
          >
            <ArrowRight size={16} className="sm:hidden" />
            <ArrowRight size={20} className="hidden sm:block" />
          </button> */}
        </div>
      </>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Onboarding overlay */}
      {showOnboarding && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-50"></div>
      )}

      {/* Onboarding tooltip for FloatingSelectors */}
      {showOnboarding && (
        <div className="fixed top-[120px] right-32 sm:right-36 lg:right-77 z-[60]">
          <img
            src="/images/arrow.svg"
            alt="onboarding"
            className="w-[19px] h-[59px] object-cover mx-auto mb-5"
          />
          <div className="w-[280px] p-4 text-center rounded-lg point-ask-gradient text-white mb-2">
            Choose your grade and how you&apos;d like the AI to talk to you.
          </div>
        </div>
      )}

      {FloatingSelectors}

      {/* History Slider */}
      <HistorySlider
        showHistorySlider={showHistorySlider}
        isClosing={isClosing}
        historyData={historyData}
        historyLoading={historyLoading}
        searchQuery={searchQuery}
        isSearching={isSearching}
        onClose={handleCloseHistory}
        onSearchClick={handleSearchChats}
        onSearchInputChange={handleSearchInputChange}
        onSearchClose={() => {
          setIsSearching(false);
          setSearchQuery("");
        }}
        onNewChat={() => {
          console.log("🔍 [HISTORY] New chat button clicked");
          handleCloseHistory();
          setSelectedChatId(null);
          setChatHistory([]);
        }}
        onViewChat={handleViewChat}
      />

      <div className="w-full px-4 lg:px-8 mt-6">
        {/* Welcome message and suggestions - only show before chat starts and when not speaking */}
        {chatHistory.length === 0 && !isConversationActive && (
          <div className=" flex flex-col mt-12 items-center max-w-4xl mx-auto">
                          <div className="mt-24 mb-4 text-center w-full">
                <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                  <span role="img" aria-label="wave">
                    👋
                  </span>{" "}
                  Got it! I&apos;ll teach you{" "}
                  {selectedStyle ? "like a " + selectedStyle : ""}{" "}
                  {selectedGrade
                    ? selectedGrade === "UG" || selectedGrade === "PG"
                      ? ` for ${selectedGrade} level`
                      : " for Grade " + selectedGrade.replace(/\D/g, "")
                    : ""}
                </div>
              <div className="text-lg text-black mb-8">
                Ask me anything when you&apos;re ready.
              </div>
            </div>
          </div>
        )}

        {/* Chat area - always show during conversation */}
        <div className="pt-24 pb-32 max-w-4xl mx-auto">
          <div className="w-full flex flex-col gap-3">
            {/* During conversation: show only SpruceBall/circle with current spoken text */}
            {isConversationActive ? (
              <div className="flex justify-center">
                <div className="flex flex-col items-center">
                  <SpruceBall listening={listening || aiSpeaking || isConversationActive} />
                </div>
              </div>
            ) : (
              // After conversation ends, show chat bubbles for both user and assistant
              chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 point-ask-gradient text-white">
                      <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                    </div>
                  ) : (
                    <div className="max-w-[85%] md:max-w-[75%] bg-[rgba(34,34,34,0.9)] text-white rounded-2xl px-5 py-3 border border-[#007437]/20">
                      <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                    </div>
                  )}
                </div>
              ))
            )}
            {thinking && !isConversationActive && (
              <div className="flex justify-start">
                <div className="bg-[rgba(34,34,34,0.9)] text-white rounded-2xl px-5 py-3 border border-[#007437]/20 opacity-70">
                  <p className="text-sm md:text-base">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        </div>
      </div>

      {/* Voice visualization */}
      <div className="flex items-center justify-center mb-8">
        {/* Remove duplicate SpruceBall here, as it is now handled in the chat area above */}
      </div>

      {/* Voice control buttons */}
      {selectedGrade && selectedStyle && !isConversationActive && (
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={startConversation}
            className="point-ask-gradient cursor-pointer hover:bg-red-600 text-white px-8 py-3 rounded-full ..."
            disabled={thinking || apiLoading}
          >
            {/* mic icon SVG */}
            <span className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
                <path d="M12 19v3m-4 0h8" />
              </svg>
              Start Conversation
            </span>
          </button>
        </div>
      )}
      
      {/* Stop button during conversation */}
      {isConversationActive && (
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={stopConversation}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop Conversation
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
