"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { chatProvider } from "@/lib/chat-provider";

interface ChatButtonProps {
  rfq_id: string;
  user_role: "architect" | "supplier";
  is_premium?: boolean;
  disabled?: boolean;
}

export default function RFQChatButton({
  rfq_id,
  user_role,
  is_premium = false,
  disabled = false,
}: ChatButtonProps) {
  const [loading, setLoading] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState(false);
  const router = useRouter();

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

      chatProvider.openChat(rfq_id);
    } catch (error) {
      console.error("Chat error:", error);
      // In a real app, use a Toast here
      alert("Failed to open chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (upgradePrompt) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
        <h3 className="font-bold text-yellow-800 mb-2">💎 Premium Feature</h3>
        <p className="text-sm text-yellow-700 mb-3">
          Direct messaging with architects requires Basic ($199/mo) or
          Enterprise plan.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/supplier/subscription")}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white font-semibold rounded hover:bg-yellow-700"
          >
            Upgrade Now
          </button>
          <button
            onClick={() => setUpgradePrompt(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleOpenChat}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded font-semibold ${
        disabled || loading
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {loading ? "Opening..." : "💬 Chat"}
    </button>
  );
}
