"use client";
import React, { useRef, useState, useEffect } from "react";
import { RealtimeAgent, RealtimeSession } from "@openai/agents-realtime";
import { convertFileToBase64 } from "@/lib/utils";
import { MessageActionTextarea } from "@/components/MessageActionTextarea";

type AnyEvent = Record<string, any>;

export default function RealtimeAssistant(): React.ReactElement {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<RealtimeSession | null>(null);
  const fetchToken = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/realtime-client-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade: 'test',
          persona: 'assistant'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch token');
      }

      const data = await response.json();
      setToken(data.token);
    } catch (error) {
      console.error('Error fetching token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handle = async () => {
    if (!token) {
      await fetchToken();
      return;
    }

    const agent = new RealtimeAgent({
      name: "pointask",
      instructions: "You are a helpful assistant that can answer questions and help with tasks.",
    })

    const session = new RealtimeSession(agent);

    try {
      await session.connect({
        model: "gpt-realtime",
       apiKey: token,
      });
      console.log('Connected successfully!');
      setSession(session);
    } catch (error) {
      console.error('Connection error:', error);
    }
  }

  const handleDisconnect = async () => {
    console.log('Disconnecting...');
    if (session) {
      await session.close();
      setSession(null);
    }
  }

  const handleImageUpload = async (file: File) => {
    console.log('Uploading image...');
    if (!session) return;

    session.sendMessage({
      role:"user",
      type:"message",
      content:[{
        type:"input_image",
        image: await convertFileToBase64(file)
      }]
    })
    console.log('Image uploaded...');
  }

  const handleMessageSubmit = async (message: string, image?: File) => {
    console.log('Sending message...');
    if (!session) return;

    if (image) {
      await handleImageUpload(image);
    }

    if (message.trim()) {
      console.log('Sending message...');
      session.sendMessage({
        role: "user",
        type: "message",
        content: [{
          type: "input_text",
          text: message
        }]
      })
    }
  }

   return (
    <div>
      <h1>Realtime Assistant Test</h1>
      <div>
        <p>Token Status: {token ? '✅ Retrieved' : '❌ Not retrieved'}</p>
        <p>Loading: {isLoading ? '⏳ Fetching token...' : '✅ Ready'}</p>
      </div>
      <button
        onClick={handle}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: token ? '#4CAF50' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Fetching Token...' : token ? 'Connect to Assistant' : 'Get Token & Connect'}
      </button>
      <button
        onClick={handleDisconnect}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: token ? '#4CAF50' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        Disconnect
      </button>

      {/* Message Input with Image Upload */}
      <div style={{ marginTop: '30px', maxWidth: '600px' }}>
        <h2>Chat with Assistant</h2>
        <MessageActionTextarea
          onSubmit={handleMessageSubmit}
          disabled={!session}
          className="mt-4"
          textAreaClassName="min-h-[120px]"
        />
      </div>
    </div>
  );
}



