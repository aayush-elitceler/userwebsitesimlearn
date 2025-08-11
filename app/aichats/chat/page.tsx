"use client";

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  ForwardedRef,
} from "react";
import Cookies from "js-cookie";
import { ArrowRight, ChevronDownIcon, X } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

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

// === START: History Types ===
interface HistoryItem {
  id?: number;
  type: "Image" | "Chat" | "Voice";
  query: string;
  date: string;
  answeredBy: string;
}
// === END: History Types ===

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
  "Why is the sky blue?",
  "Explain photosynthesis in simple words.",
];

export default function AiChatsChatPage() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [streamingMessageIndex, setStreamingMessageIndex] = useState<
    number | null
  >(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [displayedText, setDisplayedText] = useState<string>("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // === START: New Onboarding Code ===
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1); // 1: grade/persona, 2: input bar

  // === START: History Slider State ===
  const [showHistorySlider, setShowHistorySlider] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  // === END: History Slider State ===

  useEffect(() => {
    // Always show onboarding on page refresh, regardless of cookie
    setShowOnboarding(true);
  }, []);

  useEffect(() => {
    if (showOnboarding) {
      if (onboardingStep === 1) {
        // First step: grade/persona tooltip for 2 seconds
        const timer = setTimeout(() => {
          setOnboardingStep(2);
        }, 2000);
        return () => clearTimeout(timer);
      } else if (onboardingStep === 2) {
        // Second step: input bar tooltip for 2 seconds
        const timer = setTimeout(() => {
          setShowOnboarding(false);
          Cookies.set("hasVisited", "true", { expires: 365 });
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [showOnboarding, onboardingStep]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSend = async (msg?: string) => {
    const sendMsg = typeof msg === "string" ? msg : inputValue;
    if (!selectedGrade || !selectedStyle || !sendMsg.trim()) return;

    setApiLoading(true);
    setChatHistory((prev) => [...prev, { role: "user", text: sendMsg.trim() }]);
    setInputValue("");
    try {
      const payload = {
        class: selectedGrade.replace(/\D/g, ""),
        style: selectedStyle,
        message: sendMsg.trim(),
      };
      const authCookie = Cookies.get("auth");
      let token: string | undefined;
      if (authCookie) {
        try {
          token = JSON.parse(authCookie).token;
        } catch {}
      }
      const res = await fetch(
        "https://apisimplylearn.selflearnai.in/api/v1/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      const responseText = data?.data?.response || data?.response || "";
      console.log("🔍 [CHAT] Response text:", data);
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
      console.error(err);
    } finally {
      setApiLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestion = (s: string) => {
    setInputValue(s);
    if (selectedGrade && selectedStyle) {
      setTimeout(() => handleSend(s), 50);
    }
  };

  // === START: History Functions ===
  const fetchHistory = async () => {
    console.log("🔍 [HISTORY] Starting to fetch history data...");
    setHistoryLoading(true);
    
    try {
      const authCookie = Cookies.get("auth");
      let token: string | undefined;
      
      if (authCookie) {
        try {
          token = JSON.parse(authCookie).token;
          console.log("🔍 [HISTORY] Auth token found:", token ? "Yes" : "No");
        } catch (error) {
          console.log("🔍 [HISTORY] Error parsing auth cookie:", error);
        }
      } else {
        console.log("🔍 [HISTORY] No auth cookie found");
      }

      // Log the API endpoint being called
      const apiUrl = "https://apisimplylearn.selflearnai.in/api/v1/ai/chat/history";
      console.log("🔍 [HISTORY] Calling API endpoint:", apiUrl);
      console.log("🔍 [HISTORY] Request headers:", {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      });

      const res = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log("🔍 [HISTORY] API response status:", res.status);
      console.log("🔍 [HISTORY] API response headers:", Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorText = await res.text();
        console.log("🔍 [HISTORY] API error response:", errorText);
        throw new Error(`Failed to fetch history: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      console.log("🔍 [HISTORY] API response data:", data);
      console.log("🔍 [HISTORY] API response data type:", typeof data);
      console.log("🔍 [HISTORY] API response data keys:", Object.keys(data || {}));
      
      // Extract history from response
      const history = data?.data?.history || data?.history || [];
      console.log("🔍 [HISTORY] Extracted history data:", history);
      console.log("🔍 [HISTORY] History data length:", history.length);
      console.log("🔍 [HISTORY] History data structure:", history);
      
      setHistoryData(history);
    } catch (err) {
      console.error("🔍 [HISTORY] Error fetching history:", err);
      // Set mock data for demonstration
      setHistoryData([
        {
          id: 1,
          type: "Image" as const,
          query: "Trapezium Area Formula",
          date: "July 26, 2025",
          answeredBy: "AI tutor"
        },
        {
          id: 2,
          type: "Chat" as const,
          query: "What is Ohm's Law?",
          date: "July 25, 2025",
          answeredBy: "AI tutor"
        },
        {
          id: 3,
          type: "Voice" as const,
          query: "What is Cyber law?",
          date: "July 25, 2025",
          answeredBy: "AI tutor"
        },
        {
          id: 4,
          type: "Chat" as const,
          query: "What is Ohm's Law?",
          date: "July 24, 2025",
          answeredBy: "AI tutor"
        }
      ] as HistoryItem[]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleHistoryClick = () => {
    console.log("🔍 [HISTORY] View history button clicked");
    setShowHistorySlider(true);
    setIsClosing(false);
    fetchHistory();
  };

  const handleCloseHistory = () => {
    console.log("🔍 [HISTORY] Closing history slider");
    setIsClosing(true);
    setTimeout(() => {
      setShowHistorySlider(false);
      setIsClosing(false);
    }, 300);
  };
  // === END: History Functions ===

  const FloatingSelectors = (
    <div
      className={`fixed z-40 flex flex-row gap-[10px] p-4 rounded-md right-4 sm:right-8 lg:right-40 transition-all duration-300 ${
        showOnboarding ? "z-[60] shadow-2xl" : ""
      }`}
      style={{
        top: "40px",
        background:
          "linear-gradient(90deg, rgba(255, 159, 39, 0.12) 0%, rgba(255, 81, 70, 0.12) 100%)",
      }}
    >
      {/* === Shared Button Styles === */}
      {/** Function to generate buttons with dropdowns */}
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
          <div key={i} className="relative">
            <button
              className={`hover:bg-orange-500 text-[#FF5146] flex items-center transition-all duration-150 ${
                value
                  ? "point-ask-gradient text-white rounded-md px-2 py-1 sm:px-3 sm:py-2 min-w-[100px] sm:min-w-[120px] justify-between"
                  : "bg-transparent hover:text-white  cursor-pointer border border-white/20 min-w-[100px] sm:min-w-[120px] justify-center rounded-md px-2 py-1"
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
                {options.map((opt: OptionType, index: number) => {
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
        )
      )}

      {/* View History Button */}
      <div className="relative">
        <button
          onClick={handleHistoryClick}
          className="rounded-md px-3 py-2 bg-[#FFE4B5] border border-[#FF5146] text-[#FF5146] hover:bg-[#FFDAB9] transition-all duration-150 flex items-center gap-2 min-w-[120px] justify-center"
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
      className="min-h-screen flex flex-col relative"
      style={{
        // backgroundImage: "url('/images/newBg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Onboarding overlay */}
      {showOnboarding && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-50"></div>
      )}

      {/* Onboarding tooltip for FloatingSelectors */}
      {showOnboarding && onboardingStep === 1 && (
        <div className="fixed top-[120px] right-4 sm:right-8 lg:right-40 z-[60]">
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

      {/* Onboarding tooltip for Input Bar */}
      {showOnboarding && onboardingStep === 2 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60]">
          <div className="w-[280px] p-4 text-center rounded-lg point-ask-gradient text-white mb-2">
            Type your question here and hit send!
          </div>
          <img
            src="/images/arrow.svg"
            alt="onboarding"
            className="w-[19px] h-[59px] object-cover mx-auto rotate-180"
          />
        </div>
      )}

      {FloatingSelectors}

      {/* History Slider */}
      {showHistorySlider && (
        <div 
          className={`fixed inset-0 z-[70] transition-opacity duration-300 ${
            isClosing ? 'bg-black/0' : 'bg-black/50'
          }`} 
          onClick={handleCloseHistory}
        >
          <div 
            className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
              isClosing ? 'translate-x-full' : 'translate-x-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF5146] flex items-center justify-center">
                  <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-black">Your history</h2>
              </div>
              <button
                onClick={handleCloseHistory}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="p-6 space-y-3">
              <button 
                onClick={() => {
                  console.log("🔍 [HISTORY] New chat button clicked");
                  handleCloseHistory();
                  // Clear current chat and start fresh
                  setChatHistory([]);
                  setInputValue("");
                }}
                className="w-full rounded-md px-4 py-3 bg-[#FFE4B5] border border-[#FF5146] text-black hover:bg-[#FFDAB9] transition-all duration-150 flex items-center gap-3 justify-center"
              >
                <svg width="20" height="20" fill="none" stroke="#FF5146" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="font-medium">New chat</span>
              </button>
              <button 
                onClick={() => {
                  console.log("🔍 [HISTORY] Search chats button clicked");
                  // TODO: Implement search functionality
                  alert("Search functionality coming soon!");
                }}
                className="w-full rounded-md px-4 py-3 bg-[#FFE4B5] border border-[#FF5146] text-black hover:bg-[#FFDAB9] transition-all duration-150 flex items-center gap-3 justify-center"
              >
                <svg width="20" height="20" fill="none" stroke="#FF5146" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="font-medium">Search chats</span>
              </button>
            </div>

            {/* History Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <h3 className="text-lg font-bold text-black mb-4">Chats</h3>
              
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5146] mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading history...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyData.map((item, index) => (
                    <div key={item.id || index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {/* Icon based on type */}
                        <div className="w-6 h-6 mt-1">
                          {item.type === "Image" && (
                            <svg width="24" height="24" fill="none" stroke="#FF5146" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          {item.type === "Chat" && (
                            <svg width="24" height="24" fill="none" stroke="#FF5146" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )}
                          {item.type === "Voice" && (
                            <svg width="24" height="24" fill="none" stroke="#FF5146" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                              <path d="M19 10v2a7 7 0 01-14 0v-2" />
                              <line x1="12" y1="19" x2="12" y2="23" />
                              <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-black">{item.type}:</span>
                            <span className="text-black">{item.query}</span>
                          </div>
                          <p className="text-sm text-gray-500">{item.answeredBy}</p>
                        </div>
                        
                        {/* View chat link */}
                        <button 
                          onClick={() => {
                            console.log("🔍 [HISTORY] View chat clicked for:", item);
                            // TODO: Implement view chat functionality
                            alert(`Viewing chat: ${item.type} - ${item.query}`);
                          }}
                          className="text-[#FF5146] text-sm font-medium hover:underline"
                        >
                          View chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full px-4 lg:px-8">
        {/* Welcome message and suggestions - only show before chat starts */}
        {chatHistory.length === 0 && (
          <div className="min-h-screen flex flex-col justify-center items-center max-w-4xl mx-auto ">
            <div className="mt-24 mb-4 text-center w-full">
              <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                <span role="img" aria-label="wave">
                  👋
                </span>{" "}
                Got it! I&apos;ll teach you{" "}
                {selectedStyle ? "like a " + selectedStyle : ""}
                {selectedGrade
                  ? " for Grade " + selectedGrade.replace(/\D/g, "")
                  : ""}
              </div>
              <div className="text-lg text-black mb-8">
                Ask me anything when you&apos;re ready.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="rounded-xl bg-gradient-to-r from-[#FF9F2733] to-[#FF514633] 
                 transition font-medium border-none shadow-sm 
                 flex items-center justify-center text-center 
                 w-full h-[110px]"
                  onClick={() => handleSuggestion(s)}
                >
                  <span
                    className="bg-gradient-to-r from-[#FF9F27] to-[#FF5146] 
                       bg-clip-text text-transparent font-semibold"
                  >
                    {s}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat area - only show after chat starts */}
        {chatHistory.length > 0 && (
          <div className="pt-24 pb-32 max-w-4xl mx-auto">
            <div className="w-full flex flex-col gap-3">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 ${
                      msg.role === "user"
                        ? "point-ask-gradient text-white"
                        : "bg-[rgba(34,34,34,0.9)] text-white border border-black"
                    }`}
                  >
                    <p className="text-sm md:text-base leading-relaxed">
                      {msg.role === "ai" &&
                      idx === streamingMessageIndex &&
                      isStreaming
                        ? `${displayedText}${displayedText ? "|" : ""}`
                        : msg.text}
                    </p>
                  </div>
                </div>
              ))}
              {apiLoading && (
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

      <ChatInputBar
        ref={inputRef}
        value={inputValue}
        onChange={(v) => setInputValue(v)}
        onSend={handleSend}
        disabled={apiLoading || !selectedGrade || !selectedStyle}
        autoFocus
        showOnboarding={showOnboarding}
      />
    </div>
  );
}

type ChatInputBarProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  autoFocus?: boolean;
  showOnboarding: boolean;
};

const ChatInputBar = forwardRef(
  (
    {
      value,
      onChange,
      onSend,
      disabled,
      autoFocus,
      showOnboarding,
    }: ChatInputBarProps,
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    const { state } = useSidebar();
    const pathname = usePathname();
    const hideSidebar =
      pathname === "/login" ||
      pathname === "/login/otp" ||
      pathname === "/register";
    const sidebarCollapsed = state === "collapsed";
    const inputBarClass = `fixed bottom-2 sm:bottom-4 z-50 px-2 sm:px-4 flex items-center gap-2 sm:gap-3 bg-[rgba(255,255,255,0.1)] py-2 sm:py-3 max-w-5xl mx-auto input-bar-responsive ${
      hideSidebar ? "" : sidebarCollapsed ? "sidebar-collapsed" : ""
    }`;

    return (
      <div
        className={inputBarClass}
        style={{
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          border: "0.96px solid rgba(255,255,255,0.2)",
          height: "55px",
        }}
      >
        <input
          ref={ref}
          type="text"
          placeholder="Type your question..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          disabled={disabled}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent p-3 text-black placeholder-gray-300 border-black focus:outline-none text-sm sm:text-base border border-black font-medium px-1 sm:px-2 rounded-full"
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="rounded-lg p-2 sm:p-3 point-ask-gradient text-white disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center min-w-[40px] sm:min-w-[48px]"
        >
          <ArrowRight size={16} className="sm:hidden" />
          <ArrowRight size={20} className="hidden sm:block" />
        </button>
      </div>
    );
  }
);
ChatInputBar.displayName = "ChatInputBar";
