"use client";

import { useState } from "react";
import { useIntercom } from "react-use-intercom";

interface ChatButtonProps {
  rfq_id: string;
  user_role: "architect" | "supplier";
}

declare global {
  interface Window {
    Intercom?: (command: string, options?: Record<string, unknown>) => void;
  }
}

export default function RFQChatButton({ rfq_id, user_role }: ChatButtonProps) {
  const { show } = useIntercom();
  const [loading, setLoading] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState(false);

  const handleOpenChat = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/rfq/chat-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfq_id, user_role }),
      });

      const data = await res.json();

      if (res.status === 403 && data.requires_premium) {
        setUpgradePrompt(true);
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error("Failed to init chat");

      // Show Intercom widget
      show();

      if (window.Intercom) {
        window.Intercom("update", {
          rfq_id,
          user_role,
          conversation_id: data.conversation_id,
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      alert("Failed to open chat");
    } finally {
      setLoading(false);
    }
  };

  // Show upgrade prompt for free suppliers
  if (upgradePrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
        <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-2xl ring-1 ring-yellow-500">
          <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
            <span>💎</span> Premium Feature
          </h3>
          <p className="text-sm text-yellow-700 mb-6">
            Direct messaging with architects is available on Premium or
            Enterprise plans. Unlock auto-match and chat now.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = "/supplier/subscription")}
              className="flex-1 px-4 py-2 bg-yellow-600 text-white font-semibold rounded hover:bg-yellow-700 transition"
            >
              Upgrade Now
            </button>
            <button
              onClick={() => setUpgradePrompt(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleOpenChat}
      disabled={loading}
      className={`px-4 py-2 rounded font-semibold transition flex items-center gap-2 ${
        loading
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
      }`}
    >
      {loading ? "Opening..." : "💬 Chat"}
    </button>
  );
}
