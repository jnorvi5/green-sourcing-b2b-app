'use client';

"use client";

import { useState, useRef, useEffect } from "react";
import {
  FaRobot,
  FaPaperPlane,
  FaTimes,
  FaExpand,
  FaCompress,
} from "react-icons/fa";

interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: {
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }[];
  name?: string;
}

export default function AgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        'Hi! I\'m the GreenChainz Sustainability Agent. I can help you find materials using data from Autodesk, EPD International, and EC3. Try asking "Find low carbon concrete" or "Search for FSC plywood".',
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      // The API returns the full history including new messages
      // We want to update our state with the full history
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out system messages and tool calls/results for display
  // We only want to show user and assistant messages with content
  const displayMessages = messages.filter(
    (m) => (m.role === "user" || m.role === "assistant") && m.content
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-teal-500 hover:bg-teal-400 text-black rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50"
        aria-label="Open Sustainability Agent"
      >
        <FaRobot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 left-6 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col z-50 transition-all duration-300 ${
        isExpanded ? "w-[800px] h-[80vh]" : "w-[400px] h-[600px]"
      } max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)]`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center">
            <FaRobot className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Sustainability Agent</h3>
            <p className="text-xs text-gray-400">
              Powered by Microsoft Foundry
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-white transition"
          >
            {isExpanded ? <FaCompress /> : <FaExpand />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-teal-600 text-white rounded-br-none"
                  : "bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-400 p-3 rounded-lg rounded-bl-none border border-gray-700 flex items-center gap-2">
              <div
                className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
              <span className="text-xs ml-1">Consulting databases...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl"
      >
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about sustainable materials..."
            className="w-full pl-4 pr-12 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-teal-500 hover:text-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
}
