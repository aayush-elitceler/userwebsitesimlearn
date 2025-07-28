"use client";
import React, { useState, useRef, useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Cookies from "js-cookie";
import { ArrowRight } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

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
  "Explain this diagram.",
  "What does this question mean?",
];

export default function PointAskVoicePage() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { transcript, listening, resetTranscript } = useSpeechRecognition();
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [displayedResponse, setDisplayedResponse] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(
    null
  );
  const [chatHistory, setChatHistory] = useState<
    Array<{
      type: "user" | "assistant" | "thinking";
      content: string;
      image?: string;
      timestamp: number;
    }>
  >([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const streamingResponseRef = useRef<string | null>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [apiResponse, apiLoading, thinking, displayedResponse, chatHistory]);

  // Typewriter effect for streaming response
  useEffect(() => {
    if (apiResponse && streamingResponseRef.current !== apiResponse) {
      streamingResponseRef.current = apiResponse;
      setIsStreaming(true);
      setDisplayedResponse(""); // Ensure it starts empty

      const words = apiResponse.split(" ");
      let currentIndex = 0;
      let currentText = "";

      // Set the first word immediately
      if (words.length > 0) {
        currentText = words[0];
        setDisplayedResponse(currentText);
        currentIndex = 1;
      }

      const interval = setInterval(() => {
        if (currentIndex < words.length) {
          currentText = currentText + " " + words[currentIndex];
          setDisplayedResponse(currentText);
          currentIndex++;
        } else {
          setIsStreaming(false);
          setPendingTranscript(null); // Clear the question only when streaming is done

          // Add the complete response to chat history
          setChatHistory((prev) => [
            ...prev,
            {
              type: "assistant",
              content: apiResponse,
              timestamp: Date.now(),
            },
          ]);

          // Clear the temporary response states
          setApiResponse(null);
          setDisplayedResponse("");
          streamingResponseRef.current = null;

          clearInterval(interval);
        }
      }, 100); // Normal speed

      return () => {
        clearInterval(interval);
      };
    }
  }, [apiResponse]); // Only depend on apiResponse to prevent re-runs

  // Floating selectors (always visible)
  const FloatingSelectors = (
    <div
      className="fixed z-40 flex flex-row gap-[10px] right-4 sm:right-8 lg:right-40"
      style={{ top: "40px" }}
    >
      {/* Grade selector */}
      <div className="relative">
        <button
          className={`hover:bg-[#005f2e] text-white flex items-center shadow-lg ${
            selectedGrade || selectedStyle
              ? "point-ask-gradient rounded-lg px-3 py-2 sm:px-4 sm:py-3 min-w-[120px] sm:min-w-[140px] justify-between"
              : "point-ask-gradient border border-white/20 justify-center"
          }`}
          style={
            !selectedGrade && !selectedStyle
              ? {
                  width: "44px",
                  height: "39px",
                  borderRadius: "4px",
                  paddingTop: "7px",
                  paddingRight: "10px",
                  paddingBottom: "7px",
                  paddingLeft: "10px",
                }
              : {}
          }
          onClick={() => {
            setShowGradeDropdown((v) => !v);
            setShowStyleDropdown(false);
          }}
        >
          {selectedGrade || selectedStyle ? (
            <>
              <div className="flex items-center gap-2">
                <img
                  src="/images/classIcon.svg"
                  alt=""
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="text-xs sm:text-sm font-medium">
                  Class :{" "}
                  {selectedGrade
                    ? selectedGrade.replace(" grade", "")
                    : "Select Grade"}
                </span>
              </div>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className={`transition-transform ${
                  showGradeDropdown ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </>
          ) : (
            <img src="/images/classIcon.svg" alt="" className="w-5 h-5" />
          )}
        </button>

        {showGradeDropdown && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg w-48 sm:w-56 py-3 z-50 border border-gray-200">
            <div className="px-4 py-2 text-gray-700 font-semibold text-sm sm:text-base">
              Select Grade
            </div>
            <div className="border-t border-gray-400  mt-2">
              {grades.map((grade, index) => (
                <div key={grade}>
                  <div
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm sm:text-base transition-colors ${
                      selectedGrade === grade
                        ? "text-[#096835]"
                        : "text-gray-700"
                    }`}
                    style={
                      selectedGrade === grade
                        ? {
                            background:
                              "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%),linear-gradient(0deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12)), #FFFFFF",
                            backgroundColor:
                              "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%),linear-gradient(0deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12)), #FFFFFF",
                          }
                        : {}
                    }
                    onClick={() => {
                      setSelectedGrade(grade);
                      setShowGradeDropdown(false);
                    }}
                  >
                    {grade}
                  </div>
                  {index < grades.length - 1 && (
                    <div className="border-t border-gray-400 "></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Style selector */}
      <div className="relative">
        <button
          className={`hover:bg-[#005f2e] text-white flex items-center shadow-lg ${
            selectedStyle
              ? "point-ask-gradient rounded-lg px-3 py-2 sm:px-4 sm:py-3 min-w-[120px] sm:min-w-[140px] justify-between"
              : "point-ask-gradient border border-white/20 justify-center"
          }`}
          style={
            !selectedStyle
              ? {
                  width: "44px",
                  height: "39px",
                  borderRadius: "4px",
                  paddingTop: "7px",
                  paddingRight: "10px",
                  paddingBottom: "7px",
                  paddingLeft: "10px",
                }
              : {}
          }
          onClick={() => {
            setShowStyleDropdown((v) => !v);
            setShowGradeDropdown(false);
          }}
        >
          {selectedStyle ? (
            <>
              <div className="flex items-center gap-2">
                <img
                  src="/images/professor.svg"
                  alt=""
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="text-xs sm:text-sm font-medium">
                  Style : {selectedStyle || "Select Style"}
                </span>
              </div>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className={`transition-transform ${
                  showStyleDropdown ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </>
          ) : (
            <img src="/images/professor.svg" alt="" className="w-5 h-5" />
          )}
        </button>
        {showStyleDropdown && (
          <div className="absolute top-full left-0 mt-2.5 bg-[white] rounded-lg shadow-lg w-35 sm:w-40 py-2 z-50">
            <div className="px-4 py-1 text-gray-700 font-semibold text-sm sm:text-base">
              Select Style
            </div>
            <div className="border-t border-gray-400 mt-2">
              {styles.map((style, index) => (
                <div key={style.label}>
                  <div
                    className={`px-3 py-2.5 cursor-pointer hover:bg-gray-50 flex items-center gap-3 text-sm sm:text-base transition-colors ${
                      selectedStyle === style.value
                        ? "text-[#096835]"
                        : "text-[#777777]"
                    }`}
                    style={
                      selectedStyle === style.value
                        ? {
                            background:
                              "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%),linear-gradient(0deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12)), #FFFFFF",
                            backgroundColor:
                              "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%),linear-gradient(0deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12)), #FFFFFF",
                          }
                        : {}
                    }
                    onClick={() => {
                      setSelectedStyle(style.value);
                      setShowStyleDropdown(false);
                    }}
                  >
                    <span className="w-7 h-7 sm:w-9 sm:h-9 point-ask-gradient rounded-lg flex items-center justify-center flex-shrink-0">
                      {style.value === "professor" && (
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 30 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6.71551 9.66688C5.86773 9.66688 5.11007 9.39888 4.44251 8.86288C3.77495 8.3271 3.34973 7.63521 3.16684 6.78721L2.26451 2.62854L0.772177 2.74121L0.589844 0.741211C2.22073 0.585655 3.56951 0.476655 4.63618 0.414211C5.70284 0.351989 6.69084 0.3251 7.60018 0.333545C8.87373 0.342212 9.94429 0.406767 10.8118 0.527211C11.6792 0.647656 12.4471 0.848878 13.1155 1.13088C13.4522 1.26954 13.7765 1.37221 14.0885 1.43888C14.4005 1.50554 14.7044 1.53888 15.0002 1.53888C15.296 1.53888 15.5862 1.50554 15.8708 1.43888C16.1553 1.37221 16.4574 1.27643 16.7772 1.15154C17.4507 0.869544 18.2524 0.664878 19.1822 0.537545C20.1122 0.410211 21.2848 0.342212 22.7002 0.333545C23.654 0.3251 24.6697 0.351989 25.7475 0.414211C26.8253 0.476655 28.0463 0.574544 29.4105 0.707878L29.2412 2.67454L27.7692 2.56188L26.8335 6.82054C26.6506 7.65988 26.231 8.3441 25.5745 8.87321C24.9181 9.40232 24.166 9.66688 23.3182 9.66688H20.4155C19.5762 9.66688 18.8373 9.41132 18.1988 8.90021C17.5604 8.3891 17.1386 7.7361 16.9335 6.94121L16.1232 3.73355H13.9105L13.1002 6.94121C12.8813 7.74966 12.4505 8.4061 11.8078 8.91055C11.1652 9.41477 10.4353 9.66688 9.61818 9.66688H6.71551ZM5.11318 6.39521C5.19673 6.7661 5.3864 7.07077 5.68218 7.30921C5.97795 7.54766 6.31129 7.66688 6.68218 7.66688H9.58484C9.95573 7.66688 10.2891 7.55532 10.5848 7.33221C10.8806 7.1091 11.0704 6.82321 11.1542 6.47455L12.0975 2.80021C11.4464 2.62066 10.7045 2.50355 9.87184 2.44888C9.0394 2.39421 8.28218 2.36688 7.60018 2.36688C7.10618 2.36688 6.56473 2.37243 5.97584 2.38354C5.38695 2.39466 4.84551 2.42243 4.35151 2.46688L5.11318 6.39521ZM18.8462 6.46188C18.93 6.81055 19.1176 7.09855 19.4092 7.32588C19.7005 7.55321 20.036 7.66688 20.4155 7.66688H23.3182C23.6975 7.66688 24.033 7.54555 24.3245 7.30288C24.6161 7.05999 24.8036 6.75743 24.8872 6.39521L25.7155 2.43355C25.2711 2.41132 24.7685 2.39466 24.2078 2.38354C23.6472 2.37243 23.1446 2.36688 22.7002 2.36688C21.9651 2.36688 21.1556 2.39421 20.2718 2.44888C19.3881 2.50355 18.5984 2.62066 17.9028 2.80021L18.8462 6.46188Z"
                            fill="white"
                          />
                        </svg>
                      )}
                      {style.value === "friend" && (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 22 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M0.798828 15.3079V13.0846C0.798828 12.5693 0.931828 12.1094 1.19783 11.7049C1.46383 11.3004 1.81908 10.9857 2.26358 10.7609C3.21391 10.296 4.1695 9.93763 5.13033 9.68563C6.09133 9.4338 7.14741 9.30788 8.29858 9.30788C9.44991 9.30788 10.506 9.4338 11.4668 9.68563C12.4278 9.93763 13.3835 10.296 14.3338 10.7609C14.7783 10.9857 15.1336 11.3004 15.3996 11.7049C15.6656 12.1094 15.7986 12.5693 15.7986 13.0846V15.3079H0.798828ZM17.7986 15.3079V12.9616C17.7986 12.3053 17.6379 11.6797 17.3166 11.0849C16.9951 10.4902 16.5391 9.97997 15.9486 9.55413C16.6191 9.65413 17.2557 9.80888 17.8583 10.0184C18.4608 10.228 19.0358 10.4758 19.5833 10.7616C20.1 11.0373 20.499 11.3622 20.7803 11.7364C21.0617 12.1104 21.2023 12.5188 21.2023 12.9616V15.3079H17.7986ZM8.29858 7.69238C7.33608 7.69238 6.51216 7.34972 5.82683 6.66438C5.1415 5.97888 4.79883 5.15488 4.79883 4.19238C4.79883 3.22988 5.1415 2.40597 5.82683 1.72063C6.51216 1.03513 7.33608 0.692383 8.29858 0.692383C9.26108 0.692383 10.0851 1.03513 10.7706 1.72063C11.4559 2.40597 11.7986 3.22988 11.7986 4.19238C11.7986 5.15488 11.4559 5.97888 10.7706 6.66438C10.0851 7.34972 9.26108 7.69238 8.29858 7.69238ZM16.9331 4.19238C16.9331 5.15488 16.5904 5.97888 15.9051 6.66438C15.2197 7.34972 14.3958 7.69238 13.4333 7.69238C13.3205 7.69238 13.1769 7.67955 13.0026 7.65388C12.8281 7.62822 12.6845 7.60005 12.5718 7.56938C12.9662 7.09522 13.2692 6.56922 13.4811 5.99138C13.6927 5.41355 13.7986 4.81355 13.7986 4.19138C13.7986 3.56905 13.6906 2.9713 13.4746 2.39813C13.2586 1.82513 12.9577 1.29763 12.5718 0.815633C12.7153 0.764299 12.8589 0.730966 13.0026 0.715633C13.1461 0.700133 13.2897 0.692383 13.4333 0.692383C14.3958 0.692383 15.2197 1.03513 15.9051 1.72063C16.5904 2.40597 16.9331 3.22988 16.9331 4.19238ZM2.29858 13.8079H14.2986V13.0846C14.2986 12.8758 14.2463 12.69 14.1418 12.5271C14.0375 12.3643 13.8718 12.222 13.6448 12.1001C12.8218 11.6758 11.9744 11.3543 11.1026 11.1356C10.2307 10.9171 9.29608 10.8079 8.29858 10.8079C7.30125 10.8079 6.36666 10.9171 5.49483 11.1356C4.62299 11.3543 3.77558 11.6758 2.95258 12.1001C2.72558 12.222 2.55983 12.3643 2.45533 12.5271C2.35083 12.69 2.29858 12.8758 2.29858 13.0846V13.8079ZM8.29858 6.19238C8.84858 6.19238 9.31941 5.99655 9.71108 5.60488C10.1027 5.21322 10.2986 4.74238 10.2986 4.19238C10.2986 3.64238 10.1027 3.17155 9.71108 2.77988C9.31941 2.38822 8.84858 2.19238 8.29858 2.19238C7.74858 2.19238 7.27775 2.38822 6.88608 2.77988C6.49441 3.17155 6.29858 3.64238 6.29858 4.19238C6.29858 4.74238 6.49441 5.21322 6.88608 5.60488C7.27775 5.99655 7.74858 6.19238 8.29858 6.19238Z"
                            fill="white"
                          />
                        </svg>
                      )}
                      {style.value === "robot" && (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2.5 11.5C1.80133 11.5 1.21 11.258 0.726 10.774C0.242 10.29 0 9.69867 0 9C0 8.30133 0.242 7.71 0.726 7.226C1.21 6.742 1.80133 6.5 2.5 6.5V4.30775C2.5 3.81058 2.677 3.385 3.031 3.031C3.385 2.677 3.81058 2.5 4.30775 2.5H7.5C7.5 1.80133 7.742 1.21 8.226 0.725999C8.71 0.241999 9.30133 0 10 0C10.6987 0 11.29 0.241999 11.774 0.725999C12.258 1.21 12.5 1.80133 12.5 2.5H15.6923C16.1894 2.5 16.615 2.677 16.969 3.031C17.323 3.385 17.5 3.81058 17.5 4.30775V6.5C18.1987 6.5 18.79 6.742 19.274 7.226C19.758 7.71 20 8.30133 20 9C20 9.69867 19.758 10.29 19.274 10.774C18.79 11.258 18.1987 11.5 17.5 11.5V15.6923C17.5 16.1894 17.323 16.615 16.969 16.969C16.615 17.323 16.1894 17.5 15.6923 17.5H4.30775C3.81058 17.5 3.385 17.323 3.031 16.969C2.677 16.615 2.5 16.1894 2.5 15.6923V11.5ZM6.99875 9.75C7.34575 9.75 7.641 9.62858 7.8845 9.38575C8.12817 9.14292 8.25 8.84808 8.25 8.50125C8.25 8.15425 8.12858 7.859 7.88575 7.6155C7.64292 7.37183 7.34808 7.25 7.00125 7.25C6.65425 7.25 6.359 7.37142 6.1155 7.61425C5.87183 7.85708 5.75 8.15192 5.75 8.49875C5.75 8.84575 5.87142 9.141 6.11425 9.3845C6.35708 9.62817 6.65192 9.75 6.99875 9.75ZM12.9988 9.75C13.3458 9.75 13.641 9.62858 13.8845 9.38575C14.1282 9.14292 14.25 8.84808 14.25 8.50125C14.25 8.15425 14.1286 7.859 13.8857 7.6155C13.6429 7.37183 13.3481 7.25 13.0013 7.25C12.6543 7.25 12.359 7.37142 12.1155 7.61425C11.8718 7.85708 11.75 8.15192 11.75 8.49875C11.75 8.84575 11.8714 9.141 12.1143 9.3845C12.3571 9.62817 12.6519 9.75 12.9988 9.75ZM6.25 13.75H13.75V12.25H6.25V13.75ZM4.30775 16H15.6923C15.7821 16 15.8558 15.9712 15.9135 15.9135C15.9712 15.8558 16 15.7821 16 15.6923V4.30775C16 4.21792 15.9712 4.14417 15.9135 4.0865C15.8558 4.02883 15.7821 4 15.6923 4H4.30775C4.21792 4 4.14417 4.02883 4.0865 4.0865C4.02883 4.14417 4 4.21792 4 4.30775V15.6923C4 15.7821 4.02883 15.8558 4.0865 15.9135C4.14417 15.9712 4.21792 16 4.30775 16Z"
                            fill="white"
                          />
                        </svg>
                      )}
                    </span>
                    {style.label}
                  </div>
                  {index < styles.length - 1 && (
                    <div className="border-t border-gray-400"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );


  // Image upload/capture logic
  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setImage(URL.createObjectURL(file));
  };

  // Send message to API
  const handleSend = async () => {
    if (!selectedGrade || !selectedStyle || !transcript.trim() || !imageFile)
      return;

    // Store the transcript before clearing it
    const currentTranscript = transcript.trim();
    const isFirstMessage = chatHistory.length === 0;

    // Add user message to chat history
    setChatHistory((prev) => [
      ...prev,
      {
        type: "user",
        content: currentTranscript,
        image: isFirstMessage ? image || undefined : undefined,
        timestamp: Date.now(),
      },
    ]);

    // Add thinking state to chat history
    setChatHistory((prev) => [
      ...prev,
      {
        type: "thinking",
        content: "Thinking...",
        timestamp: Date.now(),
      },
    ]);

    setApiLoading(true);
    setApiError(null);
    setApiResponse(null);
    setDisplayedResponse("");
    setIsStreaming(false);
    setThinking(true);
    setPendingTranscript(currentTranscript);

    // Clear transcript immediately after storing it
    resetTranscript();

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("prompt", currentTranscript);
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

      // Make API request
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log("Sending request with:", {
        prompt: currentTranscript,
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
      console.log("Setting API response:", responseText);

      // Remove thinking state from chat history
      setChatHistory((prev) => prev.filter((msg) => msg.type !== "thinking"));

      // Reset streaming states before setting new response
      setDisplayedResponse("");
      setIsStreaming(false);
      setApiResponse(responseText);
    } catch (err) {
      console.error("Error in handleSend:", err);
      setApiError(
        err instanceof Error ? err.message : "Failed to get response"
      );
      // Remove thinking state even on error
      setChatHistory((prev) => prev.filter((msg) => msg.type !== "thinking"));
    } finally {
      setApiLoading(false);
      setThinking(false);
      // Keep pendingTranscript visible until streaming is complete
      // setPendingTranscript(null); // Removed this line
    }
  };

  // Suggestion click handler
  const handleSuggestion = () => {
    resetTranscript();
    SpeechRecognition.stopListening();
    // Optionally, you could auto-fill transcript or start listening
  };

  function MicInputBar() {
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
          className="flex-1 bg-transparent text-black placeholder-gray-300 border border-black p-3 rounded-md focus:outline-none text-sm sm:text-base font-medium px-1 sm:px-2"
          type="text"
          placeholder="Tap the mic and ask anything"
          value={thinking ? transcript : transcript}
          readOnly
        />
        <button
          className={`rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-2xl ${
            listening
              ? "point-ask-gradient text-black"
              : "bg-[#4A4A4A] text-white"
          } transition min-w-[40px] sm:min-w-[48px]`}
          onClick={() => {
            resetTranscript();
            SpeechRecognition.startListening({ continuous: false });
          }}
          disabled={listening || thinking || apiLoading || !image}
          aria-label="Start voice recording"
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
        <button
          className="rounded-lg p-2 sm:p-3 point-ask-gradient text-white disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center min-w-[40px] sm:min-w-[48px]"
          onClick={handleSend}
          disabled={!transcript.trim() || apiLoading || thinking || !image}
        >
          <ArrowRight size={16} className="sm:hidden" />
          <ArrowRight size={20} className="hidden sm:block" />
        </button>
      </div>
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
      <div className="w-full px-4 lg:px-8">
        {/* Welcome and suggestions, only if no image yet */}
        {!image && (
          <div className="min-h-screen flex flex-col justify-center items-center max-w-4xl mx-auto">
            <div className="mt-24 mb-4 text-center w-full">
              <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                <span role="img" aria-label="wave">
                  👋
                </span>{" "}
                Upload a question image to get started!
              </div>
              <div className="text-lg text-gray-300 mb-8">
                Select your class and style, then upload a photo of your
                question.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="border border-black rounded-xl py-8 px-6 text-lg text-black bg-transparent hover:bg-[#FFB12133] transition font-medium w-full"
                  onClick={() => handleSuggestion()}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Image upload/camera */}
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

        {/* After image is uploaded - show smaller preview and chat area */}
        {image && (
          <div className="pt-24 pb-32">
            {/* Compact image preview when image is uploaded but no response yet */}
            {!apiResponse && !thinking && !pendingTranscript && (
              <div className="w-full flex flex-col items-center mb-6">
                <div className="rounded-2xl overflow-hidden bg-black w-full sm:w-[300px] max-w-full h-[100px] sm:h-[120px] flex items-center justify-center mb-4">
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

            {/* Chat area */}
            <div className="w-full flex flex-col gap-3">
              {/* Render all messages from chat history */}
              {chatHistory.map((message, index) => (
                <div
                  key={`${message.type}-${message.timestamp}-${index}`}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 ${
                      message.type === "user"
                        ? "point-ask-gradient text-white"
                        : message.type === "thinking"
                        ? "bg-[rgba(34,34,34,0.9)] text-white border border-[#007437]/20 opacity-70"
                        : "bg-[rgba(34,34,34,0.9)] text-white border border-[#007437]/20"
                    }`}
                  >
                    {/* Show image only with the first user message */}
                    {message.type === "user" && message.image && (
                      <div className="mb-3">
                        <img
                          src={message.image}
                          alt="Question"
                          className="w-full max-w-[150px] h-auto rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {/* Current question if there's a pending transcript but no streaming yet */}
              {pendingTranscript &&
                !chatHistory.some(
                  (msg) => msg.content === pendingTranscript
                ) && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 point-ask-gradient text-white">
                      {/* Show small image with the first question */}
                      <div className="mb-3">
                        <img
                          src={image}
                          alt="Question"
                          className="w-full max-w-[150px] h-auto rounded-lg object-cover"
                        />
                      </div>
                      <p className="text-sm md:text-base leading-relaxed">
                        {pendingTranscript}
                      </p>
                    </div>
                  </div>
                )}

              {/* Show currently streaming response */}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] md:max-w-[75%] bg-[rgba(34,34,34,0.9)] text-white rounded-2xl px-5 py-3 border border-[#007437]/20">
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">
                      {displayedResponse || "Loading..."}
                      <span className="animate-pulse">|</span>
                    </p>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          </div>
        )}
      </div>

      {/* Voice input bar, only enabled after all options are selected */}
      {selectedGrade && selectedStyle && image && <MicInputBar />}
      {apiError && (
        <div className="text-red-400 mb-2 fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30">
          {apiError}
        </div>
      )}
    </div>
  );
}

// function MicBar({ micActive }: { micActive?: boolean }) {
//   return (
//     <div className="w-full bg-[#525252] rounded-full flex items-center px-6 py-4 text-lg text-[#fff] shadow-lg border border-[#fff]/10">
//       <span className="flex-1 text-[#fff] opacity-80">Tap the mic and ask anything</span>
//       <button
//         className={`ml-4 w-12 h-12 rounded-full flex items-center justify-center ${micActive ? "point-ask-gradient text-black" : "bg-[#888888] text-white"}`}
//       >
//         <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//           <rect x="9" y="2" width="6" height="12" rx="3"/>
//           <path d="M5 10v2a7 7 0 0 0 14 0v-2"/>
//           <path d="M12 19v3m-4 0h8"/>
//         </svg>
//       </button>
//     </div>
//   );
// }
