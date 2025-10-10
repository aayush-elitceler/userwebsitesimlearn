"use client";
import React, { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import { ArrowRight, ChevronDownIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
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
const styles = [
  {
    label: "Professor",
    value: "professor",
    icon: (
      <span className="bg-gradient-primary rounded-full w-10 h-10 flex items-center justify-center mr-4">
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
      <span className="bg-gradient-primary rounded-full w-10 h-10 flex items-center justify-center mr-4">
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
      <span className="bg-gradient-primary rounded-full w-10 h-10 flex items-center justify-center mr-4">
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



export default function PointAskChatPage() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<
    {
      role: "user" | "ai";
      text: string;
      image?: string;
      isStreaming?: boolean;
    }[]
  >([]);
  const [streamingMessageIndex, setStreamingMessageIndex] = useState<
    number | null
  >(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [displayedText, setDisplayedText] = useState<string>("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // === START: New Onboarding Code ===
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1); // 1: class selection, 2: persona selection

  // === START: History Slider State ===
  const [showHistorySlider, setShowHistorySlider] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  // === END: History Slider State ===

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
            Cookies.set("hasVisitedPointAsk", "true", { expires: 365 });
          }, 1000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [showOnboarding, onboardingStep, selectedGrade, selectedStyle]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, apiLoading, isStreaming, displayedText]);

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
            currentIndex++;
          } else {
            setIsStreaming(false);
            setStreamingMessageIndex(null);
            clearInterval(interval);
          }
        }, 80); // Adjust speed here (lower = faster)

        return () => clearInterval(interval);
      }
    }
  }, [streamingMessageIndex, isStreaming, chatHistory]);

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

  const FloatingSelectors = (
    <div>
      {/* Outer flex holding gradient box and history button */}
      <div
        className="fixed z-[60] flex flex-row items-center gap-[10px] right-32 sm:right-36 lg:right-44"
        style={{ top: "40px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Class & Persona selectors inside gradient */}
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
            <div key={i} className="relative dropdown-container">
              <button
                className={`flex items-center transition-all duration-200 rounded-xl px-4 py-2.5 min-w-[120px] sm:min-w-[140px] justify-between backdrop-blur-sm ${
                  value
                    ? "bg-gradient-primary text-white shadow-lg shadow-orange-500/25"
                    : "bg-white/90 hover:bg-white text-gray-700 border border-gray-200/60 hover:border-gray-300 hover:shadow-md shadow-sm"
                }`}
                onClick={onClick}
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
                <div className="absolute mt-2 z-10 bg-white/95 backdrop-blur-md rounded-xl shadow-xl max-h-[300px] overflow-y-auto w-full border border-gray-200/50 dropdown-container animate-in fade-in-0 zoom-in-95 duration-200">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100/80 px-4 py-3 rounded-t-xl border-b border-gray-200/50">
                    <span className="text-sm font-semibold text-gray-700">Select {label}</span>
                  </div>
                  {/* Options */}
                  {options.map((opt: OptionType) => {
                    const key = isOptionWithIcon(opt) ? opt.label : opt;
                    const value = isOptionWithIcon(opt) ? opt.value : opt;

                    return (
                      <div
                        key={key}
                        className="px-4 py-3 hover:bg-blue-50/80 cursor-pointer text-sm text-gray-700 border-b border-gray-100/50 last:border-b-0 transition-all duration-150 hover:shadow-sm"
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
          className="rounded-full px-4 py-2 bg-[#90ee90] border border-[#006a3d] text-[#006a3d] hover:bg-[#87ceeb] transition-all duration-150 flex items-center gap-2 min-w-[120px] justify-center shadow-sm"
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
  
  // Utility: downscale and compress an image for faster uploads
  const compressImage = async (file: File, maxDim = 1024, quality = 0.75): Promise<File> => {
    try {
      const img = document.createElement('img');
      const objectUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = objectUrl;
      });
      const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
      const targetW = Math.round((img.naturalWidth || img.width) * ratio) || 1024;
      const targetH = Math.round((img.naturalHeight || img.height) * ratio) || 768;
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Compression failed'))), 'image/jpeg', quality)
      );
      URL.revokeObjectURL(objectUrl);
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
    } catch (e) {
      console.warn('Image compression failed, using original:', e);
      return file;
    }
  };

  // Image upload/capture logic
  const handleImageUpload = async (file: File) => {
    const compressed = await compressImage(file);
    setImageFile(compressed);
    setImage(URL.createObjectURL(compressed));
  };

  // Send message to API
  const handleSend = async (msg?: string) => {
    const sendMsg = typeof msg === "string" ? msg : message;
    if (!selectedGrade || !selectedStyle || !sendMsg.trim() || !imageFile)
      return;
    setApiLoading(true);
    setApiError(null);

    // Add user message with image to chat history
    setChatHistory((prev) => [
      ...prev,
      {
        role: "user",
        text: sendMsg.trim(),
        image: image || undefined,
      },
    ]);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("prompt", sendMsg.trim());
              formData.append("class", formatGradeForAPI(selectedGrade));
      formData.append("style", selectedStyle.toLowerCase());

      // Get auth token
      const authCookie = Cookies.get("auth");
      let token: string | undefined;
      if (authCookie) {
        try {
          token = JSON.parse(authCookie).token;
        } catch (e) {
          console.error("Error parsing auth cookie:", e);
        }
      }

      // Make API request to image-chat endpoint
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log("Sending request with:", {
        prompt: sendMsg.trim(),
        class: formatGradeForAPI(selectedGrade),
        style: selectedStyle.toLowerCase(),
        imageFile: imageFile.name,
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(
        "https://apisimplylearn.selflearnai.in/api/v1/ai/image-chat",
        {
          method: "POST",
          headers,
          body: formData,
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error:", res.status, errorText);
        throw new Error(`API Error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log("API Response:", data);

      const responseText =
        data?.data?.response || data?.response || "No response received";

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
      console.error("Error in handleSend:", err);
      const msg = err instanceof Error ? (err.name === 'AbortError' ? 'Request timed out. Please try again.' : err.message) : 'Failed to get response';
      setApiError(msg);
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Onboarding overlay */}
      {showOnboarding && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-50"></div>
      )}

      {/* Onboarding tooltip for Class Selection */}
      {showOnboarding && onboardingStep === 1 && (
        <div className="fixed top-[100px] right-62 sm:right-66 lg:right-100 z-[60]">
          <img
            src="/images/arrow.svg"
            alt="onboarding"
            className="w-[19px] h-[59px] object-cover mx-auto mb-5"
          />
          <div className="w-[280px] p-4 text-center rounded-lg bg-gradient-primary text-white mb-2">
            {selectedGrade ? (
              <div>
                <div className="mb-2">Great! You've selected:</div>
                <div className="text-sm opacity-90">
                  Class: {selectedGrade}
                </div>
                <div className="text-xs mt-2 opacity-75">Now let's choose your persona...</div>
              </div>
            ) : (
              <div>
                <div className="mb-2">First, choose your class/grade level.</div>
                <div className="text-xs opacity-75">
                  This helps me teach at the right level for you.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onboarding tooltip for Persona Selection */}
      {showOnboarding && onboardingStep === 2 && (
        <div className="fixed top-[100px] right-32 sm:right-36 lg:right-64 z-[60]">
          <img
            src="/images/arrow.svg"
            alt="onboarding"
            className="w-[19px] h-[59px] object-cover mx-auto mb-5"
          />
          <div className="w-[280px] p-4 text-center rounded-lg bg-gradient-primary text-white mb-2">
            {selectedStyle ? (
              <div>
                <div className="mb-2">Perfect! You've selected:</div>
                <div className="text-sm opacity-90">
                  Persona: {selectedStyle}
                </div>
                <div className="text-xs mt-2 opacity-75">Now you can upload an image and start chatting!</div>
              </div>
            ) : (
              <div>
                <div className="mb-2">Now choose how you'd like me to talk to you.</div>
                <div className="text-xs opacity-75">
                  Professor, Friend, or Robot - pick your style!
                </div>
              </div>
            )}
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
          setMessage("");
          setImage(null);
          setImageFile(null);
        }}
        onViewChat={handleViewChat}
      />

      <div className="w-full px-4 lg:px-8">
        {/* Welcome and suggestions, only if no chat history */}
        {chatHistory.length === 0 && (
          <div className="min-h-screen flex flex-col justify-center items-center max-w-4xl mx-auto">
            <div className="mt-24 mb-4 text-center w-full">
              <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                <span role="img" aria-label="wave">
                  👋
                </span>{" "}
                Upload a question image to get started!
              </div>
              <div className="text-lg text-black mb-8">
                Select your class and style, then upload a photo of your
                question.
              </div>
            </div>



            {/* Image upload area - only show if no image uploaded */}
            {!image && (
              <div className="flex flex-col md:flex-row gap-8 w-full justify-center mb-8 ">
                <button
                  className="flex items-center justify-center gap-4 rounded-xl px-8 py-6 text-lg font-medium bg-gradient-to-r from-[#FF9F2733] to-[#006a3d33] 
                 transition font-medium border-none shadow-sm 
                text-black w-full md:w-1/2 border border-black hover:bg-gradient-to-r hover:from-[#006a3d] hover:to-[#006a3d] hover:text-white hover:border-[#006a3d] "
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="bg-gradient-primary rounded-full w-12 h-12 flex items-center justify-center">
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
            )}

            {/* Image preview after upload but before chat */}
            {image && chatHistory.length === 0 && (
              <div className="w-full flex flex-col items-center mb-8">
                <div className="rounded-2xl overflow-hidden bg-black w-full sm:w-[400px] max-w-full h-[120px] sm:h-[150px] flex items-center justify-center mb-4">
                  <img
                    src={image}
                    alt="Uploaded question"
                    className="object-cover w-full h-full"
                  />
                </div>

                {/* Image captured indicator with icon */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-white font-medium text-lg rounded-lg px-6 py-2 bg-gradient-primary">
                    Image captured
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-[5.3px]">
                  <button
                    className="text-white font-medium transition-colors flex items-center justify-center"
                    style={{
                      width: "114.5274658203125px",
                      height: "89.60714721679688px",
                      borderRadius: "16.97px",
                      paddingLeft: "18.03px",
                      paddingRight: "18.03px",
                      backgroundColor: "#3C434B",
                    }}
                    onClick={() => {
                      // Scroll to chat input
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
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        width="40"
                        height="39"
                        viewBox="0 0 40 39"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="0.912109"
                          y="0.286133"
                          width="38.706"
                          height="38.706"
                          rx="19.353"
                          fill="#4BA959"
                        />
                        <mask
                          id="mask0_597_150732_use"
                          style={{ maskType: "alpha" }}
                          maskUnits="userSpaceOnUse"
                          x="10"
                          y="9"
                          width="21"
                          height="21"
                        >
                          <rect
                            x="10.168"
                            y="9.56543"
                            width="20.1483"
                            height="20.1483"
                            fill="#D9D9D9"
                          />
                        </mask>
                        <g mask="url(#mask0_597_150732_use)">
                          <path
                            d="M18.1854 24.3861L13.707 19.9078L14.6045 19.0101L18.1854 22.5911L25.88 14.8965L26.7774 15.7941L18.1854 24.3861Z"
                            fill="white"
                          />
                        </g>
                      </svg>
                      <span className="text-sm">Use this</span>
                    </div>
                  </button>

                  <button
                    className="text-white font-medium transition-colors flex items-center justify-center"
                    style={{
                      width: "114.5274658203125px",
                      height: "89.60714721679688px",
                      borderRadius: "16.97px",
                      paddingLeft: "18.03px",
                      paddingRight: "18.03px",
                      backgroundColor: "#3C434B",
                    }}
                    onClick={() => {
                      // Clear image and reset file input
                      setImage(null);
                      setImageFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 40 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="0.648438"
                          y="0.510742"
                          width="38.706"
                          height="38.706"
                          rx="19.353"
                          fill="#FFC107"
                        />
                        <mask
                          id="mask0_597_150739"
                          style={{ maskType: "alpha" }}
                          maskUnits="userSpaceOnUse"
                          x="9"
                          y="9"
                          width="22"
                          height="21"
                        >
                          <rect
                            x="9.9043"
                            y="9.79004"
                            width="20.1483"
                            height="20.1483"
                            fill="#D9D9D9"
                          />
                        </mask>
                        <g mask="url(#mask0_597_150739)">
                          <path
                            d="M19.9796 27.8396C18.9894 27.8396 18.0617 27.6523 17.1964 27.2777C16.331 26.9031 15.5765 26.394 14.9329 25.7504C14.2893 25.1068 13.7802 24.3523 13.4056 23.4869C13.031 22.6216 12.8438 21.6939 12.8438 20.7037H14.103C14.103 22.3407 14.6732 23.7294 15.8135 24.8698C16.9539 26.0101 18.3426 26.5803 19.9796 26.5803C21.6167 26.5803 23.0054 26.0101 24.1457 24.8698C25.2861 23.7294 25.8562 22.3407 25.8562 20.7037C25.8562 19.0666 25.2861 17.6779 24.1457 16.5376C23.0054 15.3972 21.6167 14.8271 19.9796 14.8271H19.7567L21.0903 16.1606L20.2057 17.0711L17.332 14.1895L20.2218 11.3076L21.1065 12.2181L19.7567 13.5678H19.9796C20.9698 13.5678 21.8976 13.7551 22.7628 14.1296C23.6282 14.5042 24.3827 15.0133 25.0264 15.6569C25.67 16.3006 26.1791 17.0551 26.5537 17.9205C26.9282 18.7857 27.1155 19.7135 27.1155 20.7037C27.1155 21.6939 26.9282 22.6216 26.5537 23.4869C26.1791 24.3523 25.67 25.1068 25.0264 25.7504C24.3827 26.394 23.6282 26.9031 22.7628 27.2777C21.8976 27.6523 20.9698 27.8396 19.9796 27.8396Z"
                            fill="#1C1B1F"
                          />
                        </g>
                      </svg>
                      <span className="text-sm">Retake</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat area - only show after chat starts */}
        {chatHistory.length > 0 && (
          <div className="pt-24 pb-32 max-w-4xl mx-auto">
            <div className="w-full flex flex-col gap-4">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-end gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } mb-2`}
                >
                  {/* AI Avatar - only show for AI messages */}
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      AI
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      msg.role === "user"
                        ? "bg-[#DDDDDD] text-[#000000]"
                        : "bg-[#FFEFD3] text-[#006a3d]"
                    }`}
                  >
                    {/* Show image with the user's first message */}
                    {msg.role === "user" && msg.image && (
                      <div className="mb-3">
                        <img
                          src={msg.image}
                          alt="Question"
                          className="w-full max-w-[200px] h-auto rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm md:text-base leading-relaxed">
                      {msg.role === "ai" &&
                      idx === streamingMessageIndex &&
                      isStreaming
                        ? `${displayedText}${displayedText ? "|" : ""}`
                        : msg.text}
                    </p>
                  </div>
                  
                  {/* User Avatar - only show for user messages */}
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(() => {
                        try {
                          const authCookie = Cookies.get("auth");
                          if (authCookie) {
                            const userData = JSON.parse(authCookie);
                            return userData.firstName?.charAt(0)?.toUpperCase() || "U";
                          }
                        } catch (e) {
                          console.error("Error parsing auth cookie:", e);
                        }
                        return "U";
                      })()}
                    </div>
                  )}
                </div>
              ))}
              {apiLoading && (
                <div className="flex items-end gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    AI
                  </div>
                  <div className="bg-[#FFEFD3] text-[#006a3d] rounded-2xl px-4 py-3 opacity-70 shadow-sm">
                    <p className="text-sm md:text-base">Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} className="h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Chat input bar, only enabled after all options are selected and image uploaded */}
      {selectedGrade && selectedStyle && image && (
        <div
          className={`fixed bottom-6 sm:bottom-8 z-50 px-2 sm:px-4 flex items-center gap-2 sm:gap-3 bg-[rgba(255,255,255,0.1)] py-2 sm:py-3 max-w-5xl mx-auto input-bar-responsive ${
            pathname === "/login" ||
            pathname === "/login/otp" ||
            pathname === "/register"
              ? ""
              : state === "collapsed"
              ? "sidebar-collapsed"
              : ""
          }`}
          style={{
            backdropFilter: "blur(10px)",
            borderRadius: "12px",
            boxShadow: "0px 4px 16px 0px #00000040",
            border: "0.96px solid #FFFFFF1F",
            height: "55px",
          }}
        >
          <input
            className="flex-1 bg-transparent text-black placeholder-gray-300 p-3 rounded-full focus:outline-none text-sm sm:text-base font-medium"
            type="text"
            placeholder="Type your question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={apiLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            autoComplete="off"
          />
          <button
            className="rounded-full p-2 sm:p-3 bg-gradient-primary text-white disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center min-w-[40px] sm:min-w-[48px]"
            onClick={() => handleSend()}
            disabled={
              !message.trim() ||
              apiLoading ||
              !selectedGrade ||
              !selectedStyle ||
              !imageFile
            }
          >
            <ArrowRight size={16} className="sm:hidden" />
            <ArrowRight size={20} className="hidden sm:block" />
          </button>
        </div>
      )}
      {apiError && (
        <div className="text-red-400 mb-2 fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30">
          {apiError}
        </div>
      )}
    </div>
  );
}
