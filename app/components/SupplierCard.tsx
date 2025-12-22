"use client";

import RFQChatButton from "./rfq-chat-button";

interface SupplierCardProps {
  supplier: {
    id: string;
    company_name: string;
    location: string;
    distance_miles: number;
    verification_status: "verified" | "unverified";
    is_premium: boolean;
    match_score: number;
    total_carbon_kg: number;
    transport_carbon_kg: number;
    embodied_carbon_kg: number;
    tier: number;
  };
  rfq_id: string;
}

export default function SupplierCard({ supplier, rfq_id }: SupplierCardProps) {
  const isVerified = supplier.verification_status === "verified";

  return (
    <div
      className={`p-5 mb-4 border rounded-xl transition-all hover:shadow-md ${
        supplier.tier === 1
          ? "border-green-500 bg-green-50/50"
          : isVerified
          ? "bg-white border-gray-200"
          : "bg-gray-50 border-gray-300 grayscale-[0.5]"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-bold text-xl text-gray-900">
              {supplier.company_name}
            </h3>
            {isVerified ? (
              <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200 flex items-center gap-1">
                ✓ Verified Sustainable
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200 flex items-center gap-1">
                ⚠️ In Transition
              </span>
            )}
            {supplier.is_premium && (
              <span className="px-2.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">
                ⭐ PREMIUM
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-1">
            {supplier.location} • {supplier.distance_miles} mi away
          </p>
        </div>

        <div className="text-right ml-4">
          <div
            className={`text-3xl font-black ${
              supplier.match_score > 80 ? "text-green-600" : "text-gray-400"
            }`}
          >
            {supplier.match_score}%
          </div>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Ai Match
          </p>
        </div>
      </div>

      {isVerified ? (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <div className="bg-white border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
            🌍 {supplier.total_carbon_kg.toLocaleString()} kg CO2
          </div>
          <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
            🚚 <span className="text-gray-400">Transport:</span>{" "}
            {supplier.transport_carbon_kg} kg
          </div>
          <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
            🏭 <span className="text-gray-400">Embodied:</span>{" "}
            {supplier.embodied_carbon_kg} kg
          </div>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-white/50 border border-dashed border-gray-300 rounded-lg">
          <p className="text-xs text-gray-500 italic">
            Carbon data not available. This supplier is currently verifying
            their EPD portfolio.
          </p>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button className="flex-[2] px-4 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition active:scale-98">
          Send RFQ
        </button>

        <div className="flex-1">
          <RFQChatButton rfq_id={rfq_id} user_role="architect" />
        </div>
      </div>
    </div>
  );
}
