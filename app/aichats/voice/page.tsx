"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import SpruceBall from "@/components/SpruceBall";
import HistorySlider from "@/components/HistorySlider";
import { fetchHistory, HistoryItem, saveHistory } from "@/lib/historyService";
import type { ChatMessage } from "@/lib/historyService";
import TwoSelectPill, { OptionWithLabel } from "@/components/TwoSelectPill";
import Cookies from "js-cookie";
import { getUserGradeFromProfile, mapClassNameToGradeOption } from "@/lib/gradeUtils";
import { redirectToLogin } from '@/lib/axiosInstance';

// --- Constants & Types ---

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
      <span className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center mr-4">
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
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
      <span className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center mr-4">
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" />
        </svg>
      </span>
    ),
  },
];

type StyleOption = "professor" | "friend";

interface UserProfile {
  id: string;
  email?: string;
  className?: string;
  [key: string]: unknown;
}

export default function VoicebaseRealtimePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // --- State Management ---
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDataChannelOpen, setIsDataChannelOpen] = useState(false);

  // Diarization states
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<"user" | "ai" | "none">(
    "none"
  );

  // Transcript display states
  const [showTranscript, setShowTranscript] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // State for user selections
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null); // No default selection
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null); // No default selection
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);

  // UI Dropdown State
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);

  // --- Refs for WebRTC Objects ---
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Audio analysis refs for diarization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  // Accumulators for streaming text
  const userTranscriptBufferRef = useRef<string>("");
  const aiTextBufferRef = useRef<string>("");
  // Prevent mic loopback from being captured as user transcript
  const assistantSpeakingRef = useRef<boolean>(false);

  // --- History Slider State ---
  const [showHistorySlider, setShowHistorySlider] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);

  // --- Onboarding State ---
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1); // 1: class selection, 2: persona selection

  // --- Core logic to update persona via DataChannel ---
  useEffect(() => {
    const authCookie = Cookies.get("auth");
    if (authCookie) {
      try {
        const authData = JSON.parse(authCookie);
        if (authData && authData.token) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (e) {
        console.error("Failed to parse auth cookie:", e);
        setIsLoggedIn(false);
      }
    }
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) return;

      const authCookie = Cookies.get("auth");
      if (!authCookie) return;

      let token: string | undefined;
      try {
        token = JSON.parse(authCookie).token;
      } catch (error) {
        console.error("Error parsing auth cookie:", error);
      }

      if (!token) return;

      try {
        const sanitizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
        const response = await fetch(`${sanitizedBaseUrl}/users/auth/get-profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          redirectToLogin();
          return;
        }

        const result = await response.json();
        if (result.success && result.data) {
          setUserProfile(result.data as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  // Auto-select grade
  useEffect(() => {
    const localGrade = getUserGradeFromProfile();
    if (localGrade && !selectedGrade) {
      setSelectedGrade(localGrade);
      return;
    }

    if (userProfile?.className && !selectedGrade) {
      const mapped = mapClassNameToGradeOption(userProfile.className);
      if (mapped) {
        setSelectedGrade(mapped);
      }
    }
  }, [userProfile, selectedGrade]);

  // --- Onboarding Effect ---
  useEffect(() => {
    // Always show onboarding on page refresh
    setShowOnboarding(true);
  }, []);

  useEffect(() => {
    if (showOnboarding) {
      if (onboardingStep === 1 && selectedGrade) {
        // User has selected class, move to persona selection after a short delay
        const timer = setTimeout(() => {
          setOnboardingStep(2);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (onboardingStep === 2 && selectedStyle) {
        // User has selected persona, end onboarding after a short delay
        const timer = setTimeout(() => {
          setShowOnboarding(false);
          Cookies.set("hasVisited", "true", { expires: 365 });
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [showOnboarding, onboardingStep, selectedGrade, selectedStyle]);

  // --- Audio Analysis for User Speech Detection ---
  const setupAudioAnalysis = useCallback(
    (stream: MediaStream) => {
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        microphone.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const detectSpeech = () => {
          if (!analyserRef.current) return;

          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Calculate average volume
          const average =
            dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          const threshold = 20; // Adjust this threshold as needed

          const speaking = average > threshold;
          setIsUserSpeaking(speaking);

          // Update current speaker
          if (speaking && !isAiSpeaking) {
            setCurrentSpeaker("user");
          } else if (isAiSpeaking && !speaking) {
            setCurrentSpeaker("ai");
          } else if (!speaking && !isAiSpeaking) {
            setCurrentSpeaker("none");
          }

          animationFrameRef.current = requestAnimationFrame(detectSpeech);
        };

        detectSpeech();
      } catch (error) {
        console.error("Error setting up audio analysis:", error);
      }
    },
    [isAiSpeaking]
  );

  const cleanupAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsUserSpeaking(false);
    setIsAiSpeaking(false);
    setCurrentSpeaker("none");
  }, []);

  useEffect(() => {
    if (!isDataChannelOpen || !selectedStyle || !dataChannelRef.current) return;
    try {
      const voice = selectedStyle === "professor" ? "echo" : "alloy";
      const instructions = `You are a helpful AI assistant. You are speaking to a ${selectedGrade} learner. Adapt your language and complexity for that grade level. Your current persona is a ${selectedStyle}. When responding as a professor, be more structured and authoritative. When responding as a friend, be more encouraging and simple. Keep responses concise and conversational.`;
      console.log(`🚀 Sending update: Style=${selectedStyle}, Voice=${voice}`);

      const sessionUpdate = {
        type: "session.update",
        session: {
          voice,
          instructions,
          input_audio_transcription: {
            model: "whisper-1",
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 200,
          },
        },
      };

      dataChannelRef.current.send(JSON.stringify(sessionUpdate));
    } catch (err) {
      console.error("🔴 Failed to send session update:", err);
      setError("Could not update the voice persona.");
    }
  }, [selectedStyle, selectedGrade, isDataChannelOpen]);

  // --- Auto-scroll transcript and show/hide logic ---
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    // Show transcript when there are messages and session is active
    setShowTranscript(transcript.length > 0 && isActive);
  }, [transcript.length, isActive]);

  // --- Effect to close dropdowns on outside click ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showGradeDropdown || showStyleDropdown) {
        const target = event.target as Element;
        if (!target.closest(".dropdown-container")) {
          setShowGradeDropdown(false);
          setShowStyleDropdown(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGradeDropdown, showStyleDropdown]);

  // --- Session Management Functions ---
  const startRealtime = useCallback(async () => {
    setError(null);
    setStatus("requesting-session");
    setIsDataChannelOpen(false);
    setTranscript([]);
    const authCookie = Cookies.get("auth");
    let token: string | undefined;

    if (authCookie) {
      const parsedAuth = JSON.parse(authCookie);
      token = parsedAuth.token;
    }

    if (!authCookie) {
      setError("You must be signed in to start a conversation.");
      setStatus("error");
      return;
    }
    try {
      token = JSON.parse(authCookie).token;
      if (!token) throw new Error("Token not found in auth cookie.");
    } catch (e) {
      setError("Invalid authentication session. Please sign in again.");
      setStatus("error");
      return;
    }

    try {
      if (!selectedGrade || !selectedStyle) {
        throw new Error("Please select a grade and persona first.");
      }

      const localSessionId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `rt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionIdRef.current = localSessionId;
      messagesRef.current = []; // Correctly initialize as an empty array
      console.log(`🚀 Starting real-time session: ${localSessionId}`);

      const sessionRes = await fetch("/api/voicebase1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          grade: selectedGrade,
          style: selectedStyle,
        }),
      });
      if (!sessionRes.ok) {
        const errorDetails = await sessionRes.json();
        console.error("Backend error details:", errorDetails);
        throw new Error(
          `Failed to create session with the backend: ${errorDetails.details || sessionRes.statusText
          }`
        );
      }
      const session = await sessionRes.json();

      if (session?.data?.sessionId) setSessionId(session.data.sessionId);
      else if (session?.sessionId) setSessionId(session.sessionId);

      setStatus("getting-mic");
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = mic;

      // Setup audio analysis for speech detection
      setupAudioAnalysis(mic);

      setStatus("creating-peer");
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.onconnectionstatechange = () => {
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          console.log("⚠ Connection ended — stopping session");
          stopRealtime();
        }
      };

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      const dc = pc.createDataChannel("oai-events");
      dc.onopen = () => {
        setIsDataChannelOpen(true);
        console.log("🔗 Data channel opened");

        // Enable transcription when data channel opens
        try {
          const enableTranscription = {
            type: "session.update",
            session: {
              input_audio_transcription: {
                model: "whisper-1",
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 200,
              },
            },
          };
          console.log("🎤 Enabling transcription...");
          dc.send(JSON.stringify(enableTranscription));
        } catch (error) {
          console.error("Failed to enable transcription:", error);
        }
      };
      dc.onclose = () => setIsDataChannelOpen(false);

      dc.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          console.debug("[RTC] Message:", msg.type, msg);

          const type: string = msg?.type || "";

          // Track assistant speaking state
          if (type.startsWith("response.")) {
            if (type.endsWith("started") || type.endsWith("created")) {
              assistantSpeakingRef.current = true;
              setIsAiSpeaking(true);
              setCurrentSpeaker("ai");
            }
            if (type.endsWith("stopped") || type.endsWith("completed")) {
              assistantSpeakingRef.current = false;
              setIsAiSpeaking(false);
              if (!isUserSpeaking) {
                setCurrentSpeaker("none");
              }
            }
          }

          // USER SPEECH TRANSCRIPTION - Multiple patterns
          // Pattern 1: Direct transcription completion
          if (
            type === "conversation.item.input_audio_transcription.completed" &&
            msg.transcript
          ) {
            const userText = msg.transcript.trim();
            if (userText) {
              console.log("👤 User (pattern 1):", userText);
              messagesRef.current.push({ role: "user", text: userText });
              setTranscript([...messagesRef.current]);
            }
          }

          // Pattern 2: Speech stopped with transcript
          if (type === "input_audio_buffer.speech_stopped" && msg.transcript) {
            const userText = msg.transcript.trim();
            if (userText) {
              console.log("👤 User (pattern 2):", userText);
              messagesRef.current.push({ role: "user", text: userText });
              setTranscript([...messagesRef.current]);
            }
          }

          // Pattern 3: Any input audio transcription event
          if (type.includes("input_audio_transcription") && msg.transcript) {
            const userText = msg.transcript.trim();
            if (userText) {
              console.log("👤 User (pattern 3):", userText);
              // Check for duplicates
              const lastMessage =
                messagesRef.current[messagesRef.current.length - 1];
              if (
                !lastMessage ||
                lastMessage.text !== userText ||
                lastMessage.role !== "user"
              ) {
                messagesRef.current.push({ role: "user", text: userText });
                setTranscript([...messagesRef.current]);
              }
            }
          }

          // Pattern 4: Streaming user transcription with delta
          if (
            type.includes("input") &&
            type.includes("transcription") &&
            msg.delta
          ) {
            if (!assistantSpeakingRef.current) {
              userTranscriptBufferRef.current += msg.delta;
              console.log("👤 User delta:", msg.delta);
            }
          }

          // Pattern 5: Finalize user transcription
          if (
            type.includes("input") &&
            type.includes("transcription") &&
            type.includes("done")
          ) {
            const userText = userTranscriptBufferRef.current.trim();
            if (userText) {
              console.log("👤 User final:", userText);
              messagesRef.current.push({ role: "user", text: userText });
              setTranscript([...messagesRef.current]);
            }
            userTranscriptBufferRef.current = "";
          }

          // Pattern 6: General transcript field check
          if (msg.transcript && typeof msg.transcript === "string") {
            const text = msg.transcript.trim();
            if (
              text &&
              !type.includes("response") &&
              !type.includes("output")
            ) {
              console.log("👤 User (general):", text);
              const lastMessage =
                messagesRef.current[messagesRef.current.length - 1];
              if (
                !lastMessage ||
                lastMessage.text !== text ||
                lastMessage.role !== "user"
              ) {
                messagesRef.current.push({ role: "user", text });
                setTranscript([...messagesRef.current]);
              }
            }
          }

          // AI RESPONSE TRANSCRIPTION
          if (type === "response.audio_transcript.delta") {
            aiTextBufferRef.current += msg.delta || "";
          }

          if (type === "response.text.delta") {
            aiTextBufferRef.current += msg.delta || "";
          }

          // Finalize AI text
          if (
            type === "response.done" ||
            type === "response.completed" ||
            type === "response.audio_transcript.done"
          ) {
            const aiText = (
              msg.transcript ||
              aiTextBufferRef.current ||
              ""
            ).trim();
            if (aiText) {
              console.log("🤖 AI response:", aiText);
              messagesRef.current.push({ role: "ai", text: aiText });
              setTranscript([...messagesRef.current]);
            }
            aiTextBufferRef.current = "";
          }
        } catch (e) {
          console.error("Failed to parse server message:", e);
        }
      };

      dataChannelRef.current = dc;
      mic.getTracks().forEach((t) => pc.addTrack(t, mic));
      setStatus("creating-offer");
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);
      setStatus("exchanging-sdp");

      const answerRes = await fetch(
        `https://api.openai.com/v1/realtime?model=${encodeURIComponent(
          session.model
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.client_secret?.value}`,
            "Content-Type": "application/sdp",
            "OpenAI-Beta": "realtime=v1",
          },
          body: offer.sdp,
        }
      );

      if (!answerRes.ok) throw new Error("SDP exchange with API failed");
      const answerSdp = await answerRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      setIsActive(true);
      setStatus("connected");
    } catch (e: any) {
      console.error(e);
      setError(
        e?.message || "An unknown error occurred while starting the session."
      );
      setStatus("error");
      stopRealtime();
    }
  }, [selectedGrade, selectedStyle]);

  const stopRealtime = useCallback(() => {
    setStatus("stopping");
    setTranscript([...messagesRef.current]);

    // Optional: Log to verify messages
    console.log("💬 Final Transcript:", messagesRef.current);

    // Cleanup audio analysis
    cleanupAudioAnalysis();

    if (pcRef.current) pcRef.current.close();
    if (localStreamRef.current)
      localStreamRef.current.getTracks().forEach((t) => t.stop());

    pcRef.current = null;
    localStreamRef.current = null;
    dataChannelRef.current = null;
    setIsActive(false);
    setIsDataChannelOpen(false);
    setStatus("idle");

    if (sessionIdRef.current && messagesRef.current.length > 0) {
      if (!messagesRef.current.find((m) => m.role === "ai")) {
        messagesRef.current.push({
          role: "ai",
          text: `Ended realtime session (${selectedStyle}) for ${selectedGrade}.`,
        });
      }
      saveHistory(messagesRef.current, sessionIdRef.current);
    }
    setSessionId(null);
  }, [selectedGrade, selectedStyle, cleanupAudioAnalysis]); // Added cleanupAudioAnalysis dependency

  // --- History Functions ---
  const fetchHistoryData = async () => {
    setHistoryLoading(true);
    try {
      const history = await fetchHistory();
      setHistoryData(history);
    } catch (err) {
      console.error("[HISTORY] Error fetching history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleHistoryClick = () => {
    setShowHistorySlider(true);
    setIsClosing(false);
    fetchHistoryData();
  };

  const handleCloseHistory = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowHistorySlider(false);
      setIsClosing(false);
    }, 300);
  };

  const handleNewChat = () => {
    handleCloseHistory();
    setSessionId(null);
    setSelectedChatId(null);
    setChatHistory([]);
    setTranscript([]); // ← Add this line
  };

  // --- Floating Selectors UI Component ---
  const FloatingSelectors = (
    <div>
      <div
        className="fixed z-[60] flex flex-row gap-[10px] items-center"
        style={{ top: "40px", right: "8rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <TwoSelectPill
          className={`${showOnboarding ? "z-[60]" : ""}`}
          left={{
            label: "Grade",
            displayValue: selectedGrade,
            options: grades,
            showDropdown: showGradeDropdown,
            onToggle: () => {
              setShowGradeDropdown((v) => !v);
              setShowStyleDropdown(false);
            },
            onSelect: (val: string) => {
              setSelectedGrade(val);
              setShowGradeDropdown(false);
            },
          }}
          right={{
            label: "Persona",
            displayValue: selectedStyle,
            options: styles as unknown as OptionWithLabel[],
            showDropdown: showStyleDropdown,
            onToggle: () => {
              setShowStyleDropdown((v) => !v);
              setShowGradeDropdown(false);
            },
            onSelect: (val: string) => {
              setSelectedStyle(val);
              setShowStyleDropdown(false);
            },
            renderOption: (style: OptionWithLabel) => (
              <div className="flex items-center gap-3 cursor-pointer">{style.label}</div>
            ),
          }}
        />

        <button
          onClick={handleHistoryClick}
          className="rounded-full px-3 py-2 bg-primary/10 border border-primary text-primary hover:bg-primary/20 transition-all duration-150 flex items-center gap-2 min-w-[120px] justify-center shadow-sm"
        >
          <img src="/images/history.svg" alt="history" className="w-4 h-4" />
          <span className="text-sm font-medium">View history</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-gray-50 p-6">
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
          <div className="w-[280px] p-4 text-center rounded-lg bg-primary text-primary-foreground mb-2">
            {selectedGrade ? (
              <div>
                <div className="mb-2">Great! You've selected:</div>
                <div className="text-sm opacity-90">Class: {selectedGrade}</div>
                <div className="text-xs mt-2 opacity-75">
                  Now let's choose your persona...
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2">
                  First, choose your class/grade level.
                </div>
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
        <div className="fixed top-[100px] right-32 sm:right-36 lg:right-54 z-[60]">
          <img
            src="/images/arrow.svg"
            alt="onboarding"
            className="w-[19px] h-[59px] object-cover mx-auto mb-5"
          />
          <div className="w-[280px] p-4 text-center rounded-lg bg-primary text-primary-foreground mb-2">
            {selectedStyle ? (
              <div>
                <div className="mb-2">Perfect! You've selected:</div>
                <div className="text-sm opacity-90">
                  Persona: {selectedStyle}
                </div>
                <div className="text-xs mt-2 opacity-75">
                  Now you can start your voice conversation...
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2">
                  Now choose how you'd like me to talk to you.
                </div>
                <div className="text-xs opacity-75">
                  Professor or Friend - pick your style!
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {FloatingSelectors}
      <HistorySlider
        showHistorySlider={showHistorySlider}
        isClosing={isClosing}
        historyData={historyData}
        historyLoading={historyLoading}
        searchQuery={searchQuery}
        isSearching={isSearching}
        onClose={handleCloseHistory}
        onSearchClick={() => {
          setIsSearching(true);
          setSearchQuery("");
        }}
        onSearchInputChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearchQuery(e.target.value)
        }
        onSearchClose={() => {
          setIsSearching(false);
          setSearchQuery("");
        }}
        onNewChat={handleNewChat}
        onViewChat={() => handleCloseHistory()}
      />

      <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col items-center justify-center">
        {!isActive ? (
          transcript.length > 0 ? (
            <div className="w-full max-w-2xl p-4 space-y-4 overflow-y-auto h-[60vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Conversation Transcript
                </h3>
                <button
                  onClick={() => setTranscript([])}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Clear
                </button>
              </div>
              {transcript.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-lg shadow-sm border ${message.role === "user"
                      ? "bg-blue-50 text-blue-900 border-blue-200"
                      : "bg-primary/10 text-primary border-primary/20"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${message.role === "user"
                          ? "text-blue-600"
                          : "text-primary"
                          }`}
                      >
                        {message.role === "user"
                          ? "You"
                          : `AI (${selectedStyle || "Assistant"})`}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-black mb-2">
                <span role="img" aria-label="wave">
                  👋
                </span>{" "}
                {selectedGrade && selectedStyle ? (
                  <>
                    Got it! I&apos;ll teach you like a {selectedStyle} for{" "}
                    {selectedGrade === "UG" || selectedGrade === "PG"
                      ? `${selectedGrade} level`
                      : `grade ${selectedGrade?.replace(/\D/g, "")}`}
                    .
                  </>
                ) : (
                  "Welcome! Please select your class and persona to get started."
                )}
              </div>
              <div className="text-lg text-black mb-8">
                {selectedGrade && selectedStyle
                  ? "Ask me anything when you're ready."
                  : "Choose your settings from the top-right corner."}
              </div>
            </div>
          )
        ) : (
          <div className="w-full max-w-4xl flex gap-6">
            {/* Left side - Diarization and Controls */}
            <div className="flex-1 flex flex-col items-center justify-center">
              {error && (
                <p className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded-md">
                  {error}
                </p>
              )}

              {/* Diarization Indicator */}
              <div className="mb-6 flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSpeaker === "user"
                      ? "bg-primary animate-pulse"
                      : "bg-gray-300"
                      }`}
                  ></div>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${currentSpeaker === "ai"
                      ? "text-primary animate-pulse"
                      : "text-gray-500"
                      }`}
                  >
                    You
                  </span>
                </div>

                <div className="w-px h-8 bg-gray-300"></div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSpeaker === "ai"
                      ? "bg-primary animate-pulse"
                      : "bg-gray-300"
                      }`}
                  ></div>
                  <span
                    className={`text-sm font-medium transition-colors duration-300 ${currentSpeaker === "ai" ? "text-primary" : "text-gray-500"
                      }`}
                  >
                    AI {selectedStyle ? `(${selectedStyle})` : ""}
                  </span>
                </div>
              </div>

              <SpruceBall listening={isActive && status === "connected"} />
            </div>

            {/* Right side - Live Transcript */}
            {/* {showTranscript && (
              <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 max-h-[70vh] flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h3 className="text-lg font-semibold text-gray-800">Live Transcript</h3>
                  <button
                    onClick={() => setShowTranscript(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div 
                  ref={transcriptRef}
                  className="flex-1 overflow-y-auto space-y-3 pr-2"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {transcript.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                          message.role === "user"
                            ? "bg-blue-100 text-blue-900 border-l-4 border-blue-500"
                            : "bg-primary/10 text-primary border-l-4 border-primary"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold uppercase tracking-wide ${
                            message.role === "user" ? "text-blue-600" : "text-primary"
                          }`}>
                            {message.role === "user" ? "You" : "AI"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{message.text}</p>
                      </div>
                    </div>
                  ))}
                  {/* Real-time typing indicators */}
            {/* {currentSpeaker === "user" && (
                    <div className="flex justify-end">
                      <div className="bg-blue-100 text-blue-900 px-3 py-2 rounded-lg text-sm border-l-4 border-blue-500 opacity-70">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">You</span>
                        <p className="italic">Speaking...</p>
                      </div>
                    </div>
                  )}
                  {currentSpeaker === "ai" && (
                    <div className="flex justify-start">
                      <div className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm border-l-4 border-primary opacity-70">
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">AI</span>
                        <p className="italic">Speaking...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )} */}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center mb-8">
        {!isActive ? (
          <button
            onClick={startRealtime}
            className="bg-primary text-primary-foreground cursor-pointer px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={
              !selectedGrade ||
              !selectedStyle ||
              status !== "idle" ||
              !isLoggedIn
            }
          >
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
        ) : (
          <div className="flex gap-3 items-center">
            <button
              onClick={stopRealtime}
              className="bg-primary text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
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

            {/* {transcript.length > 0 && (
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all ${
                  showTranscript
                    ? "bg-primary text-primary-foreground"
                    : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12h6m-6-4h6m-6 8h6M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  </svg>
                  {showTranscript ? "Hide" : "Show"} Transcript
                </span>
              </button>
            )} */}
          </div>
        )}
      </div>

      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
      <style>{`
        .bg-primary {
          background-color: var(--primary);
        }
      `}</style>
    </div>
  );
}
