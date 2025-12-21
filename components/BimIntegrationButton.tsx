"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { FaDownload, FaTimes } from "react-icons/fa";

interface BimIntegrationButtonProps {
  productName: string;
}

export default function BimIntegrationButton({ productName }: BimIntegrationButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    // Fire PostHog event
    posthog.capture("feature_interest_bim", {
      product_name: productName,
      feature: "revit_family_download",
    });

    // Open modal
    setShowModal(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition mt-3 flex items-center justify-center gap-2"
      >
        <FaDownload /> Download Revit Family
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-white/10 rounded-xl max-w-md w-full p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Pro Feature</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4 mb-6">
              <p className="text-teal-300 font-medium">
                BIM Integration is coming soon!
              </p>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Direct Revit Family downloads will be available in the <strong>Pro Tier</strong>.
              Join the waitlist to get early access and be notified when it launches.
            </p>

            <div className="flex flex-col gap-3">
              <button
                className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-lg transition"
                onClick={() => {
                   posthog.capture("bim_waitlist_join_click", {
                       product_name: productName
                   });
                   setShowModal(false);
                   alert("Thanks! You've been added to the waitlist.");
                }}
              >
                Join Waitlist
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-lg transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
