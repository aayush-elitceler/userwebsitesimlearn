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
import { fetchHistory, getFilteredHistory, HistoryItem } from "@/lib/historyService";
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

// === START: History Types ===
interface RawHistoryItem {
  id?: string;
  title?: string;
  userId?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  messages?: unknown[];
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
  "UG",
  "PG",
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
        // First step: wait for user to select both grade and persona
        if (selectedGrade && selectedStyle) {
          // User has selected both, move to next step after a short delay
          const timer = setTimeout(() => {
            setOnboardingStep(2);
          }, 1000);
          return () => clearTimeout(timer);
        }
      } else if (onboardingStep === 2) {
        // Second step: input bar tooltip for 2 seconds
        const timer = setTimeout(() => {
          setShowOnboarding(false);
          Cookies.set("hasVisited", "true", { expires: 365 });
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [showOnboarding, onboardingStep, selectedGrade, selectedStyle]);

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

  const handleSend = async (msg?: string) => {
    const sendMsg = typeof msg === "string" ? msg : inputValue;
    if (!selectedGrade || !selectedStyle || !sendMsg.trim()) return;

    // Clear history indicator when starting a new conversation
    if (selectedChatId) {
      setSelectedChatId(null);
    }

    setApiLoading(true);
    setChatHistory((prev) => [...prev, { role: "user", text: sendMsg.trim() }]);
    setInputValue("");
    try {
      const payload = {
        class: formatGradeForAPI(selectedGrade),
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
    // Clear history indicator when using suggestions
    if (selectedChatId) {
      setSelectedChatId(null);
    }
    
    setInputValue(s);
    if (selectedGrade && selectedStyle) {
      setTimeout(() => handleSend(s), 50);
    }
  };

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
        setInputValue(chatTitle);
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
      {/* Wrapper for selectors */}
      <div className="fixed z-[60] flex flex-row gap-[10px] items-center" style={{ top: "40px", right: "8rem" }} onClick={(e) => e.stopPropagation()}>
        
        {/* Class & Persona in colored background */}
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
  
        {/* View History Button OUTSIDE colored box */}
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
        <div className="fixed top-[100px] right-32 sm:right-36 lg:right-60 z-[60]">
          <img
            src="/images/arrow.svg"
            alt="onboarding"
            className="w-[19px] h-[59px] object-cover mx-auto mb-5"
          />
          <div className="w-[280px] p-4 text-center rounded-lg point-ask-gradient text-white mb-2">
            {selectedGrade && selectedStyle ? (
              <div>
                <div className="mb-2">Great! You've selected:</div>
                <div className="text-sm opacity-90">
                  Grade: {selectedGrade} | Style: {selectedStyle}
                </div>
                <div className="text-xs mt-2 opacity-75">Moving to chat in a moment...</div>
              </div>
            ) : (
              <div>
                <div className="mb-2">Choose your grade and how you&apos;d like the AI to talk to you.</div>
                <div className="text-xs opacity-75">
                  {!selectedGrade && !selectedStyle && "Please select both grade and persona"}
                  {selectedGrade && !selectedStyle && "Now select a persona"}
                  {!selectedGrade && selectedStyle && "Now select a grade"}
                </div>
              </div>
            )}
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
          setInputValue("");
        }}
        onViewChat={handleViewChat}
      />

      <div className="w-full px-4 lg:px-8">
        {/* Welcome message and suggestions - only show before chat starts */}
        {chatHistory.length === 0 && (
          <div className="min-h-screen flex flex-col justify-center items-center max-w-4xl mx-auto ">
            <div className="mt-32 mb-4 text-center w-full">
              <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                <span role="img" aria-label="wave">
                  👋
                </span>{" "}
                Got it! I&apos;ll teach you{" "}
                {selectedStyle ? "like a " + selectedStyle : ""}
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
          <div className="pt-32 pb-32 max-w-4xl mx-auto min-h-screen flex flex-col justify-end relative z-10">
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
                        ? "bg-[#FFF8DC] text-gray-800 border border-[#FFE4B5]"
                        : "bg-[#FFE6CC] text-[#FF5146] border border-[#FFDAB9]"
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
                  <div className="bg-[#FFE6CC] text-[#FF5146] rounded-2xl px-4 py-3 border border-[#FFDAB9] opacity-70 shadow-sm">
                    <p className="text-sm md:text-base">Thinking...</p>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} className="h-4" />
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
    const inputBarClass = `fixed bottom-6 sm:bottom-8 z-50 px-2 sm:px-4 flex items-center gap-2 sm:gap-3 bg-[rgba(255,255,255,0.1)] py-2 sm:py-3 max-w-5xl mx-auto input-bar-responsive ${
      hideSidebar ? "" : sidebarCollapsed ? "sidebar-collapsed" : ""
    }`;

    return (
      <div
        className={inputBarClass}
        style={{
          height: "55px",
          boxShadow: "0px 4px 16px 0px #00000040",
          border: "0.96px solid #FFFFFF1F",
          borderRadius: "12px",
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
          className={`flex-1 bg-transparent p-3 text-black placeholder-gray-300 focus:outline-none text-sm sm:text-base font-medium rounded-full transition-all duration-300 ${
            showOnboarding 
              ? "border-2 border-orange-500 shadow-lg shadow-orange-500/50" 
              : ""
          }`}
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="rounded-full p-2 sm:p-3 point-ask-gradient text-white disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center min-w-[40px] sm:min-w-[48px]"
        >
          <ArrowRight size={16} className="sm:hidden" />
          <ArrowRight size={20} className="hidden sm:block" />
        </button>
      </div>
    );
  }
);
ChatInputBar.displayName = "ChatInputBar";
