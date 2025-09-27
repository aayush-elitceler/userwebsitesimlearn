"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents-realtime";
import { convertFileToBase64 } from "@/lib/utils";
import { MessageActionTextarea } from "@/components/MessageActionTextarea";
import TwoSelectPill, { OptionWithLabel } from "@/components/TwoSelectPill";
import SpruceBall from "@/components/SpruceBall";
import { Mic } from "lucide-react";

type RealtimeStatus =
  | "idle"
  | "fetching_token"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error";

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

const personaOptions: OptionWithLabel[] = [
  {
    label: "Professor",
    value: "professor",
    icon: (
      <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
      <span className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
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

export default function RealtimeAssistant(): React.ReactElement {
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<RealtimeSession | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const snapshotIntervalRef = useRef<number | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [showHeading, setShowHeading] = useState(true);
  const [headingText, setHeadingText] = useState("Welcome ! please select you class and person to get started");

  const personaLabel = useMemo(() => {
    return (
      personaOptions.find((option) => option.value === selectedPersona)
        ?.label ?? null
    );
  }, [selectedPersona]);

  const personaVoice = useMemo(() => {
    switch (selectedPersona) {
      case "friend":
        return "alloy";
      case "professor":
        return "echo";
      default:
        return undefined;
    }
  }, [selectedPersona]);

  const clearSnapshotInterval = useCallback(() => {
    if (snapshotIntervalRef.current !== null) {
      window.clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }
  }, []);

  const isBusy = useMemo(
    () =>
      status === "fetching_token" ||
      status === "connecting" ||
      status === "disconnecting",
    [status]
  );

  const isConnected = status === "connected" && !!session;

  const fetchToken = useCallback(async (): Promise<string | null> => {
    if (token) return token;

    try {
      const response = await fetch("/api/realtime-client-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grade: selectedGrade,
          persona: selectedPersona,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch token");
      }

      const data = await response.json();
      setToken(data.token);
      return data.token ?? null;
    } catch (err) {
      console.error("Error fetching token:", err);
      setError(
        err instanceof Error ? err.message : "Unable to fetch access token."
      );
      return null;
    }
  }, [selectedGrade, selectedPersona, token]);

  const stopShareScreen = useCallback(() => {
    clearSnapshotInterval();
    setScreenStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [clearSnapshotInterval]);

  useEffect(() => {
    return () => {
      if (session) {
        try {
          session.close();
        } catch (err) {
          console.warn("Failed to close session on cleanup", err);
        }
      }
      stopShareScreen();
    };
  }, [session, stopShareScreen]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = screenStream ?? null;
    }
  }, [screenStream]);

  useEffect(() => {
    setToken(null);
  }, [selectedGrade, selectedPersona]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) {
        return;
      }

      if (target.closest(".dropdown-container")) {
        return;
      }

      setShowGradeDropdown(false);
      setShowPersonaDropdown(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedGrade && selectedPersona) {
      setHeadingText(`Got it i'l teach you like a freind for ${selectedGrade}`);
    }
  }, [selectedGrade, selectedPersona]);

  useEffect(() => {
    if (isConnected) {
      setShowHeading(false);
    }
  }, [isConnected]);

  const startConversation = useCallback(async () => {
    if (isBusy || isConnected) {
      return;
    }

    if (!selectedGrade || !selectedPersona) {
      setError("Please pick a grade and persona before starting.");
      return;
    }

    setError(null);
    setStatus("fetching_token");

    const apiKey = await fetchToken();
    if (!apiKey) {
      setStatus("error");
      return;
    }

    setStatus("connecting");

    if (session) {
      try {
        await session.close();
      } catch (err) {
        console.warn("Previous session close failed", err);
      } finally {
        setSession(null);
      }
    }

    const personaLabelForInstructions = personaOptions.find(
      (option) => option.value === selectedPersona
    )?.label;

    const baseInstructions =
      "Respond only when the user asks a question or provides an explicit request. If you receive images, screenshots, or updates without a question, silently store that context and wait until the user speaks again. Never speculate about the user's surroundings or describe visuals unless they explicitly confirm what you're seeing.";

    const agentInstructions = selectedGrade
      ? `You are a helpful assistant guiding a ${selectedGrade} learner. Speak with the tone of a ${
          personaLabelForInstructions?.toLowerCase() ?? selectedPersona
        }. Keep explanations adaptive, clear, and encouraging. ${baseInstructions}`
      : `You are a helpful assistant that can answer questions and help with tasks. ${baseInstructions}`;

    const agent = new RealtimeAgent({
      name: "pointask",
      instructions: agentInstructions,
    });

    const sessionConfig = personaVoice
      ? {
          voice: personaVoice,
          audio: {
            output: {
              voice: personaVoice,
            },
          },
        }
      : undefined;

    const newSession = new RealtimeSession(
      agent,
      sessionConfig ? { config: sessionConfig } : undefined
    );

    try {
      await newSession.connect({
        model: "gpt-realtime",
        apiKey,
      });

      console.log("Connected successfully!");
      setSession(newSession);
      setStatus("connected");
    } catch (err) {
      console.error("Connection error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the real-time assistant."
      );
      setStatus("error");
      try {
        await newSession.close();
      } catch (closeError) {
        console.warn(
          "Failed to close session after connection error",
          closeError
        );
      }
    }
  }, [
    fetchToken,
    isBusy,
    isConnected,
    personaVoice,
    selectedGrade,
    selectedPersona,
    session,
  ]);

  const handleDisconnect = useCallback(async () => {
    if (!session) return;

    setStatus("disconnecting");
    setError(null);

    try {
      await session.close();
    } catch (err) {
      console.warn("Session close failed:", err);
    } finally {
      setSession(null);
      stopShareScreen();
      setStatus("idle");
    }
  }, [session, stopShareScreen]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!session) return;

      try {
        const image = await convertFileToBase64(file);
        session.sendMessage({
          role: "user",
          type: "message",
          content: [
            {
              type: "input_image",
              image,
            },
          ],
        });
      } catch (err) {
        console.error("Image upload failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to upload the selected image."
        );
      }
    },
    [session]
  );

  const handleMessageSubmit = useCallback(
    async (message: string, image?: File) => {
      if (!session) {
        setError("Connect to the assistant before sending messages.");
        return;
      }

      const trimmedMessage = message.trim();

      if (!image && !trimmedMessage) {
        return;
      }

      if (image) {
        await handleImageUpload(image);
      }

      if (!trimmedMessage) {
        return;
      }

      try {
        session.sendMessage({
          role: "user",
          type: "message",
          content: [
            {
              type: "input_text",
              text: trimmedMessage,
            },
          ],
        });
      } catch (err) {
        console.error("Failed to send message:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to deliver the message to the assistant."
        );
      }
    },
    [handleImageUpload, session]
  );

  const handleShareScreen = useCallback(async () => {
    if (!isConnected) {
      setError("Connect to the assistant before sharing your screen.");
      return;
    }

    try {
      if (!navigator?.mediaDevices?.getDisplayMedia) {
        setError("Screen sharing isn't supported in this browser.");
        return;
      }

      clearSnapshotInterval();
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          stopShareScreen();
        });
      });

      setError(null);
      setScreenStream(stream);
    } catch (err) {
      if ((err as DOMException)?.name === "NotAllowedError") {
        setError("Screen sharing request was cancelled.");
      } else {
        console.error("Screen share failed:", err);
        setError(
          err instanceof Error ? err.message : "Unable to start screen sharing."
        );
      }
    }
  }, [clearSnapshotInterval, isConnected, stopShareScreen]);

  const sendScreenSnapshot = useCallback(async () => {
    if (!session || !screenStream || !videoRef.current) {
      setError("Start screen sharing before sending a snapshot.");
      return;
    }

    const video = videoRef.current;

    if (video.readyState < 2) {
      await new Promise((resolve) => {
        video.addEventListener("loadeddata", resolve, { once: true });
      });
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");

    if (!context) {
      setError("Could not capture the screen frame.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");

    try {
      session.sendMessage({
        role: "user",
        type: "message",
        content: [
          {
            type: "input_image",
            image: dataUrl,
          },
        ],
      });
    } catch (err) {
      console.error("Failed to send screenshot:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to share the screen snapshot with the assistant."
      );
    }
  }, [screenStream, session]);

  useEffect(() => {
    if (!session || !screenStream) {
      clearSnapshotInterval();
      return;
    }

    const sendInitialSnapshot = async () => {
      await sendScreenSnapshot();
    };

    void sendInitialSnapshot();

    snapshotIntervalRef.current = window.setInterval(() => {
      void sendScreenSnapshot();
    }, 5000);

    return () => {
      clearSnapshotInterval();
    };
  }, [clearSnapshotInterval, screenStream, sendScreenSnapshot, session]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case "fetching_token":
        return "Requesting access token";
      case "connecting":
        return "Connecting to assistant";
      case "connected":
        return "Live conversation active";
      case "disconnecting":
        return "Ending session";
      case "error":
        return "Needs attention";
      default:
        return "Ready when you are";
    }
  }, [status]);

  const isShareActive = Boolean(screenStream);
  const canStartConversation =
    !isBusy && !isConnected && !!selectedGrade && !!selectedPersona;
  const canShareScreen = isConnected && !isBusy;
  const canTriggerPrimaryAction = isConnected ? !isBusy : canStartConversation;
  const primaryButtonLabel = (() => {
    if (status === "disconnecting") return "Ending…";
    if (isConnected) return "End session";
    if (isBusy) return "Starting…";
    return "Start conversation";
  })();
  const primaryButtonClassName = isConnected
    ? "inline-flex w-full min-w-[180px] items-center justify-center rounded-full border border-gray-200 bg-white px-8 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2 justify-center"
    : "inline-flex w-full min-w-[180px] items-center justify-center rounded-full bg-primary px-8 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2 justify-center";

  const handlePrimaryAction = useCallback(() => {
    if (isConnected) {
      void handleDisconnect();
      return;
    }

    void startConversation();
  }, [handleDisconnect, isConnected, startConversation]);

  const floatingSelectors = (
    <div className="pointer-events-none">
      <div
        className="pointer-events-auto fixed top-8 right-8 z-40 flex flex-col items-end gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <TwoSelectPill
          className="drop-shadow-xl backdrop-blur"
          left={{
            label: "Grade",
            displayValue: selectedGrade,
            options: grades,
            showDropdown: showGradeDropdown,
            onToggle: () => {
              setShowGradeDropdown((value) => !value);
              setShowPersonaDropdown(false);
            },
            onSelect: (value: string) => {
              setSelectedGrade(value);
              setShowGradeDropdown(false);
            },
          }}
          right={{
            label: "Persona",
            displayValue: personaLabel,
            options: personaOptions,
            showDropdown: showPersonaDropdown,
            onToggle: () => {
              setShowPersonaDropdown((value) => !value);
              setShowGradeDropdown(false);
            },
            onSelect: (value: string) => {
              setSelectedPersona(value);
              setShowPersonaDropdown(false);
            },
            renderOption: (option) => (
              <div className="flex items-center gap-3 cursor-pointer">{option.label}</div>
            ),
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-rose-50 via-white to-white text-gray-900">
      {floatingSelectors}

      <div className="relative z-10 flex min-h-screen flex-col">


        <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="relative flex w-full max-w-lg flex-col items-center">
            <div className="absolute -inset-8 -z-10 rounded-full bg-primary/5 blur-3xl" aria-hidden />
            {showHeading && (
              <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
                {headingText}
              </h1>
            )}
            <SpruceBall listening={isConnected} />
          </div>
        </main>

        <footer className="px-6 pb-12">
          <div className="pointer-events-auto mx-auto flex justify-center w-full max-w-3xl items-center gap-4 rounded-3xl bg-white/80 p-6  sm:gap-6">
            <MessageActionTextarea
              onSubmit={handleMessageSubmit}
              disabled={!isConnected}
            />
            <div className="flex w-full flex-col gap-3  sm:w-auto sm:flex-row">
              <button
                onClick={handlePrimaryAction}
                disabled={!canTriggerPrimaryAction}
                className={primaryButtonClassName}
              >
               <Mic width={16} height={16}/> {primaryButtonLabel}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
