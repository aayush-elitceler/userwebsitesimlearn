"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Cookies from "js-cookie";
import { ArrowRight, ChevronDownIcon, X } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { encode } from "gpt-tokenizer";
import SpruceBall from "@/components/SpruceBall";

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

  const chatBottomRef = useRef<HTMLDivElement>(null);

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
  }, [chatHistory, thinking, aiSpeaking, displayedText]);

  // Send message to API with better error handling and speech synthesis integration
  const handleSend = useCallback(async () => {
    if (!selectedGrade || !selectedStyle || !inputValue.trim()) return;

    setApiLoading(true);
    setThinking(true);
    // Store user message temporarily but don't add to chat history yet
    const userMessage = inputValue.trim();

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

      const res = await fetch(
        "https://apisimplylearn.selflearnai.in/api/v1/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            class: selectedGrade.replace(/\D/g, ""),
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
            voice.lang.startsWith("en") &&
            (voice.name.includes("Female") ||
              voice.name.includes("Samantha") ||
              voice.name.includes("Ava"))
        ) || voices.find((voice) => voice.lang.startsWith("en"));

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
          { role: "user", text: userMessage },
          { role: "ai", text: responseText }
        ]);
        setDisplayedText(""); // Clear the displayed text since it's now in chat history
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
  }, [selectedGrade, selectedStyle, inputValue, resetTranscript]);

  

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
    <div
    className="absolute z-40 flex flex-row gap-[10px] p-4 rounded-md right-4 sm:right-8 lg:right-40"
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
      {FloatingSelectors}
      <div className="w-full px-4 lg:px-8 mt-6">
        {/* Welcome message and suggestions - only show before chat starts and when not speaking */}
        {chatHistory.length === 0 && !aiSpeaking && !listening && (
          <div className=" flex flex-col mt-12 items-center max-w-4xl mx-auto">
            <div className="mt-24 mb-4 text-center w-full">
              <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                <span role="img" aria-label="wave">
                  👋
                </span>{" "}
                Got it! I&apos;ll teach you{" "}
                {selectedStyle ? "like a " + selectedStyle : ""}{" "}
                {selectedGrade
                  ? " for Grade " + selectedGrade.replace(/\D/g, "")
                  : ""}
              </div>
              <div className="text-lg text-black mb-8">
                Ask me anything when you&apos;re ready.
              </div>
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
                  {msg.role === "user" ? (
                    <div className="max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 point-ask-gradient text-white">
                      <p className="text-sm md:text-base leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-[85%] md:max-w-[75%] bg-[rgba(34,34,34,0.9)] text-white rounded-2xl px-5 py-3 border border-[#007437]/20">
                      <p className="text-sm md:text-base leading-relaxed">
                        {msg.text}
                      </p>
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
              {/* AI Speaking - Show the current response while speaking */}
              {aiSpeaking && displayedText && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] md:max-w-[75%] bg-[rgba(34,34,34,0.9)] text-white rounded-2xl px-5 py-3 border border-[#007437]/20">
                    <p className="text-sm md:text-base leading-relaxed">
                      {displayedText}
                    </p>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          </div>
        )}
      </div>

      {/* Voice visualization */}
      <div className="flex items-center justify-center mb-8">
        {/* Show SpruceBall when listening or when AI is speaking */}
        {(listening || aiSpeaking) && (
          <SpruceBall listening={listening || aiSpeaking} />
        )}
      </div>

      {/* Voice control buttons */}
      {selectedGrade && selectedStyle && !listening && !aiSpeaking && (
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={handleStartListening}
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
              Start Speaking
            </span>
          </button>
        </div>
      )}
      
      {/* Stop button while listening */}
      {listening && (
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={handleStopListening}
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
              Stop
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
