"use client";
import React, { useState, useRef, useEffect } from "react";
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
  "What is this math problem asking?",
  "Can you solve this equation?",
  "Explain this diagrams.",
  "What does this question mean?",
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

  // Suggestion click handler
  const handleSuggestion = (s: string) => {
    setMessage(s);
    if (selectedGrade && selectedStyle && imageFile) {
      setTimeout(() => handleSend(s), 100);
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
  // Image upload/capture logic
  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setImage(URL.createObjectURL(file));
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
      formData.append("class", selectedGrade.replace(/\D/g, ""));
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
        class: selectedGrade.replace(/\D/g, ""),
        style: selectedStyle.toLowerCase(),
        imageFile: imageFile.name,
      });

      const res = await fetch(
        "https://apisimplylearn.selflearnai.in/api/v1/ai/image-chat",
        {
          method: "POST",
          headers,
          body: formData,
        }
      );

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
      setApiError(
        err instanceof Error ? err.message : "Failed to get response"
      );
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
      {FloatingSelectors}
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

            {/* Show suggestions only if no image uploaded yet */}
            {!image && (
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
            )}

            {/* Image upload area - only show if no image uploaded */}
            {!image && (
              <div className="flex flex-col md:flex-row gap-8 w-full justify-center mb-8">
                <button
                  className="flex items-center justify-center gap-4 rounded-xl px-8 py-6 text-lg font-medium bg-transparent text-black w-full md:w-1/2 border border-black"
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
                  <span className="text-white font-medium text-lg rounded-lg px-6 py-2 point-ask-gradient">
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
                        : "bg-[rgba(34,34,34,0.9)] text-white border border-[#007437]/20"
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

      {/* Chat input bar, only enabled after all options are selected and image uploaded */}
      {selectedGrade && selectedStyle && image && (
        <div
          className={`fixed bottom-2 sm:bottom-4 z-50 px-2 sm:px-4 flex items-center gap-2 sm:gap-3 bg-[rgba(255,255,255,0.1)] py-2 sm:py-3 max-w-5xl mx-auto input-bar-responsive ${
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
            border: "0.96px solid rgba(255,255,255,0.2)",
            height: "55px",
          }}
        >
          <input
            className="flex-1 bg-transparent text-black placeholder-gray-300 p-3 rounded-md border border-black focus:outline-none text-sm sm:text-base font-medium px-1 sm:px-2"
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
            className="rounded-lg p-2 sm:p-3 point-ask-gradient text-white disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center min-w-[40px] sm:min-w-[48px]"
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
