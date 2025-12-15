'use client';

'use client';

import { useState, useEffect } from 'react';

export default function BuyCleanActCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // California Buy Clean Act Compliance Deadline: Jan 1, 2026
    const deadline = new Date('2026-01-01T00:00:00');

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border border-red-500/30 rounded-xl p-6 mb-8 text-white relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-red-500/20 transition-all duration-500"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h3 className="text-xl font-bold text-red-100">Buy Clean Act Compliance Countdown</h3>
          </div>
          <p className="text-gray-300 max-w-md text-sm">
            Mandatory embodied carbon limits for public projects go into effect in California on Jan 1, 2026. Is your supply chain ready?
          </p>
        </div>

        <div className="flex gap-4 text-center">
          <div className="bg-black/30 rounded-lg p-3 min-w-[70px] backdrop-blur-sm border border-white/5">
            <div className="text-3xl font-mono font-bold text-white mb-1">{timeLeft.days}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Days</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 min-w-[70px] backdrop-blur-sm border border-white/5">
            <div className="text-3xl font-mono font-bold text-white mb-1">{timeLeft.hours}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Hours</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 min-w-[70px] backdrop-blur-sm border border-white/5">
            <div className="text-3xl font-mono font-bold text-white mb-1">{timeLeft.minutes}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Mins</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 min-w-[70px] backdrop-blur-sm border border-white/5">
            <div className="text-3xl font-mono font-bold text-red-400 mb-1">{timeLeft.seconds}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Secs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
