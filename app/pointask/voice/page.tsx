"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Cookies from "js-cookie";
import { ArrowRight, ChevronDownIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import VoiceOverlay from "@/components/VoiceOverlay";
import AIMessage from "@/components/VoiceWave";
import { encode } from "gpt-tokenizer";
import SpruceBall from "@/components/SpruceBall";
import { fetchHistory, HistoryItem } from "@/lib/historyService";
import HistorySlider from "@/components/HistorySlider";

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
  typeof opt === "object" && "label" in opt && "value" in opt;

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
];

const styles = [
  {
    label: "Professor",
    value: "professor",
  },
  {
    label: "Friend",
    value: "friend",
  },
  {
    label: "Robot",
    value: "robot",
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
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageConfirmed, setIsImageConfirmed] = useState(false);

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; text: string; image?: string }[]
  >([]);
  const [streamingMessageIndex, setStreamingMessageIndex] = useState<
    number | null
  >(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [displayedText, setDisplayedText] = useState<string>("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [microphonePermission, setMicrophonePermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");

  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!listening) {
      console.log(true, "stopListening");
      handleStopListening();
    }
  }, [listening]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, thinking, isStreaming, displayedText]);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setImage(URL.createObjectURL(file));
  };
  // Send message to API with better error handling
  const handleSend = useCallback(async () => {
    if (!selectedGrade || !selectedStyle || !inputValue.trim() || !imageFile)
      return;

    const isFirstMessage = chatHistory.length === 0;

    setApiLoading(true);
    setThinking(true);
    setChatHistory((prev) => [
      ...prev,
      {
        role: "user",
        text: inputValue.trim(),
        image: isFirstMessage ? image || undefined : undefined,
      },
    ]);

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
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const formData = new FormData();
      formData.append("class", selectedGrade.replace(/\D/g, ""));
      formData.append("style", selectedStyle.toLowerCase());
      formData.append("prompt", inputValue.trim());
      formData.append("image", imageFile); // ✅ File will now be sent properly

      const res = await fetch(
        "https://apisimplylearn.selflearnai.in/api/v1/ai/image-chat",
        {
          method: "POST",
          headers,
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const responseText =
        data?.data?.response || "Sorry, I couldn't process your request.";

      // Token/Model Logging
      const model = "Gemini 1.0 Pro";
      const inputTokens = encode(inputValue.trim()).length;
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

      // Add AI message and trigger streaming
      setChatHistory((prev) => {
        const newHistory = [
          ...prev,
          { role: "ai" as const, text: responseText },
        ];
        setStreamingMessageIndex(newHistory.length - 1);
        setIsStreaming(true);
        return newHistory;
      });
    } catch (err) {
      console.error("API Error:", err);
      setChatHistory((prev) => [
        ...prev,
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
  }, [selectedGrade, selectedStyle, inputValue, resetTranscript]);
  console.log(isImageConfirmed, "isImageConfirmed");

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
      console.error("Error stopping speech recognition:", error);
      setSpeechError("Failed to stop listening");
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

  // Typewriter effect for streaming chat messages
  useEffect(() => {
    if (streamingMessageIndex !== null && isStreaming) {
      const message = chatHistory[streamingMessageIndex];
      if (message && message.role === "ai") {
        const words = message.text.split(" ");
        let currentIndex = 0;
        setDisplayedText("");

        const interval = setInterval(() => {
          if (currentIndex < words.length) {
            setDisplayedText((prev) => {
              const newText =
                currentIndex === 0
                  ? words[0]
                  : prev + " " + words[currentIndex];
              return newText;
            });
            currentIndex++; // ✅ Corrected line
          } else {
            setIsStreaming(false);
            setStreamingMessageIndex(null);
            clearInterval(interval);
          }
        }, 80);

        return () => clearInterval(interval);
      }
    }
  }, [streamingMessageIndex, isStreaming, chatHistory]);

  // When transcript changes, update inputValue
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

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
        const formattedMessages = chatItem.messages.map((msg: any, index: number) => {
          console.log(`🔍 [HISTORY] Processing message ${index}:`, msg);
          
          const role = msg.role === 'USER' ? 'user' : 'ai';
          const text = msg.content || '';
          
          console.log(`🔍 [HISTORY] Message ${index} - Role: ${role}, Text: ${text}`);
          
          return {
            role: role as 'user' | 'ai',
            text: text
          };
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

  // Floating selectors component
  const FloatingSelectors = (
    <div>
      {/* Outer flex holding gradient box and history button */}
      <div
        className="fixed z-40 flex flex-row items-center gap-[10px] right-32 sm:right-36 lg:right-44"
        style={{ top: "40px" }}
      >
        {/* Class & Persona selectors inside gradient */}
        <div
          className="flex flex-row gap-[10px] p-4 rounded-md"
          style={{
            background:
              "linear-gradient(90deg, rgba(255, 159, 39, 0.12) 0%, rgba(255, 81, 70, 0.12) 100%)",
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
          ].map(({ label, value, onClick, options, showDropdown, onSelect, renderOption }, i) => (
            <div key={i} className="relative">
              <button
                className={`hover:bg-orange-500 text-[#FF5146] flex items-center transition-all duration-150 ${
                  value
                    ? "point-ask-gradient text-white rounded-md px-2 py-1 sm:px-3 sm:py-2 min-w-[100px] sm:min-w-[120px] justify-between"
                    : "bg-transparent hover:text-white cursor-pointer border border-white/20 min-w-[100px] sm:min-w-[120px] justify-center rounded-md px-2 py-1"
                }`}
                style={
                  !value
                    ? {
                        width: "44px",
                        height: "39px",
                        borderRadius: "4px",
                        padding: "7px 10px",
                      }
                    : {}
                }
                onClick={onClick}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap flex items-center">
                    <span className="mr-1">{label}:</span>
                    <span>{value || "Select"}</span>
                    <ChevronDownIcon className="ml-1 size-4 shrink-0" />
                  </span>
                </div>
              </button>
  
              {showDropdown && (
                <div className="absolute mt-2 z-10 bg-white rounded-md shadow-lg max-h-[132px] overflow-y-auto w-full">
                  {options.map((opt: OptionType) => {
                    const key = isOptionWithIcon(opt) ? opt.label : opt;
                    const value = isOptionWithIcon(opt) ? opt.value : opt;
  
                    return (
                      <div
                        key={key}
                        className="px-4 py-2 hover:bg-orange-100 cursor-pointer text-sm sm:text-base text-[#777]"
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
          ))}
        </div>
  
        {/* View History Button outside gradient */}
        <button
          onClick={handleHistoryClick}
          className="rounded-full px-4 py-2 bg-[#FFE4B5] border border-[#FF5146] text-[#FF5146] hover:bg-[#FFDAB9] transition-all duration-150 flex items-center gap-2 min-w-[120px] justify-center shadow-sm"
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
  

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
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
          setImage(null);
          setImageFile(null);
          setIsImageConfirmed(false);
        }}
        onViewChat={handleViewChat}
      />

      <div className="w-full px-4 lg:px-8 mt-6">
        {/* Welcome message and suggestions - only show before chat starts */}
        {!image && chatHistory.length === 0 && (
          <div className=" flex flex-col mt-12 items-center max-w-4xl mx-auto">
            <div className="mt-24 mb-4 text-center w-full">
              <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                <span role="img" aria-label="wave">
                  👋
                </span>{" "}
                Upload a question image to get started!
                {selectedStyle ? "like a " + selectedStyle : ""}{" "}
                {selectedGrade
                  ? " for Grade " + selectedGrade.replace(/\D/g, "")
                  : ""}
              </div>
              <div className="text-lg text-black mb-8">
                Select your class and style, then upload a photo of your
                question.
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-8 w-full justify-center mb-8">
              <button
                className="flex items-center justify-center gap-4 rounded-xl px-8 py-6 text-lg font-medium bg-transparent text-black w-full md:w-1/2 border border-[#007437]/30"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="point-ask-gradient rounded-full w-12 h-12 flex items-center justify-center">
                  <svg
                    width="28"
                    height="28"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </span>
                Upload Image
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                />
              </button>
            </div>
          </div>
        )}
        {image && !thinking && (
          <div className="pt-24">
            {/* Compact image preview when image is uploaded but no response yet */}

            <div className="w-full flex flex-col items-center mb-6">
              <div className="rounded-2xl overflow-hidden bg-black w-full sm:w-[600px] max-w-full h-[300px] sm:h-[300px] flex items-center justify-center mb-4">
                <img
                  src={image}
                  alt="Uploaded question"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white font-medium text-lg rounded-lg px-6 py-2 point-ask-gradient">
                  Image captured
                </span>
              </div>
              {/* Action buttons */}
             {!isImageConfirmed && <div className="flex gap-[5.3px]">
                {/* Use this */}
                <button
                  className="text-white font-medium transition-colors flex items-center justify-center"
                  style={{
                    width: "114.5px",
                    height: "89.6px",
                    borderRadius: "16.97px",
                    backgroundColor: "#3C434B",
                  }}
                  onClick={() => {
                    console.log("use this clicked");
                    
                    setIsImageConfirmed(true);
                    const chatInput = document.querySelector(
                      'input[placeholder="Type your question..."]'
                    ) as HTMLInputElement;
                    if (chatInput) {
                      chatInput.focus();
                      chatInput.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                     // ✅ Confirm image
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    {/* [Icon omitted for brevity] */}
                    <img src="/images/usethis.svg" alt="" />
                    <span className="text-sm">Use this</span>
                  </div>
                </button>
                <button
                  className="text-white font-medium transition-colors flex items-center justify-center"
                  style={{
                    width: "114.5px",
                    height: "89.6px",
                    borderRadius: "16.97px",
                    backgroundColor: "#3C434B",
                  }}
                  onClick={() => {
                    setImage(null);
                    setImageFile(null);
                    setIsImageConfirmed(false); // ❌ Reset confirmation
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    {/* [Icon omitted for brevity] */}
                    <img src="/images/retake.svg" alt="" />
                    <span className="text-sm">Retake</span>
                  </div>
                </button>
              </div>}
            </div>
          </div>
        )}

        {/* Chat area - only show after chat starts */}
        {chatHistory.length > 0 && (
          <div className="pb-32 max-w-4xl mx-auto">
            <div className="w-full flex flex-col gap-3">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 point-ask-gradient text-white">
                      <p className="text-sm md:text-base leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-[85%] md:max-w-[75%]">
                      <AIMessage text={msg.text} />
                    </div>
                  )}
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="bg-[rgba(34,34,34,0.9)] text-white rounded-2xl px-5 py-3 border border-[#007437]/20 opacity-70">
                    <p className="text-sm md:text-base">Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          </div>
        )}
      </div>

      {/* Only show input bar if both selectors are chosen */}
      {/* {selectedGrade && selectedStyle && <MicInputBar />} */}
      <div className="flex items-center justify-center mb-8">
        {listening && <SpruceBall listening={listening} />}
      </div>

      <div className="mb-8">
        {isImageConfirmed && (
         <div className="flex gap-3 justify-center mb-8">
         <button
           onClick={handleStartListening}
           className="point-ask-gradient cursor-pointer hover:bg-red-600 text-white px-8 py-3 rounded-full ..."
         >
           {/* mic icon SVG */}
           Start Speaking
         </button>
       </div>
        )}
      </div>
    </div>
  );
}
