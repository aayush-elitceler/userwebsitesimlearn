"use client";

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  ForwardedRef,
} from "react";
import Cookies from "js-cookie";
import { ArrowRight, ChevronDownIcon } from "lucide-react";
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

  const FloatingSelectors = (
    <div
      className="fixed z-40 flex flex-row gap-[10px] p-4 rounded-md right-4 sm:right-8 lg:right-40"
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
      {FloatingSelectors}

      <div className="w-full px-4 lg:px-8">
        {/* Welcome message and suggestions - only show before chat starts */}
        {chatHistory.length === 0 && (
          <div className="min-h-screen flex flex-col justify-center items-center max-w-4xl mx-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="border border-black rounded-xl py-8 px-6 text-lg text-black bg-transparent hover:bg-[#FFB12133] transition font-medium w-full"
                  onClick={() => handleSuggestion(s)}
                >
                  {s}
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

      {/* Only show input bar once both selectors are set */}
      {selectedGrade && selectedStyle && (
        <ChatInputBar
          ref={inputRef}
          value={inputValue}
          onChange={(v) => setInputValue(v)}
          onSend={handleSend}
          disabled={apiLoading}
          autoFocus
        />
      )}
    </div>
  );
}

type ChatInputBarProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  autoFocus?: boolean;
};

const ChatInputBar = forwardRef(
  (
    { value, onChange, onSend, disabled, autoFocus }: ChatInputBarProps,
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
