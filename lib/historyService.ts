import Cookies from "js-cookie";

// === START: History Types ===
export interface HistoryItem {
  id?: string | number;
  type: "Image" | "Chat" | "Voice" | string; // Allow any string type for flexibility
  query: string;
  date: string;
  answeredBy: string;
  messages?: unknown[]; // Added to store individual chat messages
}
export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}


export interface RawHistoryItem {
  id?: string;
  title?: string;
  userId?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  messages?: unknown[]; // Added to match API response
}

export interface HistoryState {
  showHistorySlider: boolean;
  historyData: HistoryItem[];
  historyLoading: boolean;
  isClosing: boolean;
  selectedChatId: string | null;
  searchQuery: string;
  isSearching: boolean;
}

export interface HistoryActions {
  setShowHistorySlider: (show: boolean) => void;
  setHistoryData: (data: HistoryItem[]) => void;
  setHistoryLoading: (loading: boolean) => void;
  setIsClosing: (closing: boolean) => void;
  setSelectedChatId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (searching: boolean) => void;
}
// === END: History Types ===
export const saveHistory = async (messages: ChatMessage[], sessionId: string): Promise<void> => {
  console.log(`📝 [HISTORY] Starting to save history for session: ${sessionId}`);
  
  // Don't save empty conversations or those without a session
  if (messages.length === 0 || !sessionId) {
    console.warn("📝 [HISTORY] Aborted save: No messages or missing sessionId.");
    return;
  }

  try {
    const authCookie = Cookies.get("auth");
    let token: string | undefined;
    
    if (authCookie) {
      token = JSON.parse(authCookie).token;
    }

    // Prefer internal API route to avoid CORS/env mismatch; server will proxy to backend
    const apiUrl = `/api/history`;
    console.log("📝 [HISTORY] Calling API endpoint for saving:", apiUrl);

    const res = await fetch(apiUrl, {
      method: "POST", // Use POST method to create a new history entry
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        sessionId: sessionId,
        messages: messages,
        title: messages[0]?.text.substring(0, 40) + "..." || "New Chat" // Generate a title
      }),
    });

    console.log("📝 [HISTORY] Save response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to save history: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    console.log("📝 [HISTORY] Save response data:", data);
    console.log("✅ Conversation saved successfully.");

  } catch (err) {
    console.error("📝 [HISTORY] Error saving history:", err);
  }
};

export const fetchHistory = async (): Promise<HistoryItem[]> => {
  console.log("🔍 [HISTORY] Starting to fetch history data...");
  
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
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/users/history`;
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
    console.log("🔍 [HISTORY] Is data an array?", Array.isArray(data));
    console.log("🔍 [HISTORY] Is data.data an array?", Array.isArray(data?.data));
    
    // Extract history from response and map to HistoryItem interface
    let rawHistory = data?.data?.history || data?.history || [];
    console.log("🔍 [HISTORY] Raw history data:", rawHistory);
    console.log("🔍 [HISTORY] Raw history data type:", typeof rawHistory);
    console.log("🔍 [HISTORY] Raw history data length:", rawHistory?.length);
    console.log("🔍 [HISTORY] Is rawHistory an array?", Array.isArray(rawHistory));
    
    // Ensure rawHistory is an array before mapping
    if (!Array.isArray(rawHistory)) {
      console.log("🔍 [HISTORY] rawHistory is not an array, converting to array");
      if (rawHistory && typeof rawHistory === 'object') {
        rawHistory = [rawHistory];
      } else {
        console.log("🔍 [HISTORY] rawHistory is not an object either, setting to empty array");
        rawHistory = [];
      }
    }
    
    // Map the API response to HistoryItem interface
    const history = rawHistory.map((item: RawHistoryItem) => {
      console.log("🔍 [HISTORY] Processing item:", item);
      console.log("🔍 [HISTORY] Item keys:", Object.keys(item));
      console.log("🔍 [HISTORY] Item messages:", item.messages);
      
      // Determine type based on imageUrl presence
      const type = item.imageUrl ? "Image" : "Chat";
      
      // Format date from createdAt
      const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : "Unknown date";
      
      return {
        id: item.id,
        type: type,
        query: item.title || "No title available",
        date: date,
        answeredBy: "AI tutor",
        messages: item.messages || []
      };
    });
    
    console.log("🔍 [HISTORY] Mapped history data:", history);
    console.log("🔍 [HISTORY] Mapped history data length:", history.length);
    
    return history;
  } catch (err) {
    console.error("🔍 [HISTORY] Error fetching history:", err);
    // Return mock data for demonstration
    return [
      {
        id: 1,
        type: "Image",
        query: "Trapezium Area Formula",
        date: "July 26, 2025",
        answeredBy: "AI tutor",
        messages: [
          { role: 'USER', content: 'Can you explain the trapezium area formula?' },
          { role: 'ASSISTANT', content: 'The area of a trapezium is calculated using the formula: A = ½ × (a + b) × h, where a and b are the lengths of the parallel sides and h is the height.' }
        ]
      },
      {
        id: 2,
        type: "Chat",
        query: "What is Ohm's Law?",
        date: "July 25, 2025",
        answeredBy: "AI tutor",
        messages: [
          { role: 'USER', content: 'What is Ohm\'s Law?' },
          { role: 'ASSISTANT', content: 'Ohm\'s Law states that the current through a conductor between two points is directly proportional to the voltage across the two points. It is expressed as V = IR, where V is voltage, I is current, and R is resistance.' }
        ]
      },
      {
        id: 3,
        type: "Voice",
        query: "What is Cyber law?",
        date: "July 25, 2025",
        answeredBy: "AI tutor",
        messages: [
          { role: 'USER', content: 'What is Cyber law?' },
          { role: 'ASSISTANT', content: 'Cyber law, also known as internet law or digital law, is the legal framework that governs activities on the internet and digital technologies. It covers issues like data protection, privacy, intellectual property, and cybercrime.' }
        ]
      },
      {
        id: 4,
        type: "Chat",
        query: "What is Ohm's Law?",
        date: "July 24, 2025",
        answeredBy: "AI tutor",
        messages: [
          { role: 'USER', content: 'Can you explain Ohm\'s Law with examples?' },
          { role: 'ASSISTANT', content: 'Ohm\'s Law (V = IR) relates voltage, current, and resistance. For example, if you have a 12V battery connected to a 6Ω resistor, the current would be I = V/R = 12V/6Ω = 2A.' }
        ]
      }
    ];
  }
};

export const getFilteredHistory = (historyData: HistoryItem[], searchQuery: string): HistoryItem[] => {
  if (!searchQuery.trim()) {
    return historyData;
  }
  
  const query = searchQuery.toLowerCase().trim();
  return historyData.filter(item => 
    item.query.toLowerCase().includes(query) ||
    item.type.toLowerCase().includes(query)
  );
};
