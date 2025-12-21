'use client';

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FiClock, FiAlertTriangle } from "react-icons/fi"

export default function BuyCleanActCountdown() {
  const [daysLeft, setDaysLeft] = useState(0)

  useEffect(() => {
    // Target date: Jan 1, 2026 (Example compliance deadline)
    const targetDate = new Date("2026-01-01").getTime()
    const now = new Date().getTime()
    const distance = targetDate - now
    setDaysLeft(Math.floor(distance / (1000 * 60 * 60 * 24)))
  }, [])

  return (
    <Card className="mb-8 border-yellow-500/50 bg-yellow-500/10">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-yellow-500/20 p-3 rounded-full">
            <FiAlertTriangle className="text-yellow-500 h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-yellow-500 text-lg">Buy Clean Act Compliance</h3>
            <p className="text-sm text-yellow-200/80">
              Ensure all your projects utilize verified low-carbon materials before the deadline.
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-yellow-950/30 px-4 py-2 rounded-lg border border-yellow-500/20">
            <FiClock className="text-yellow-500" />
            <span className="font-mono text-xl font-bold text-yellow-400">{daysLeft > 0 ? daysLeft : 0}</span>
            <span className="text-xs text-yellow-500 uppercase font-medium mt-1">Days Left</span>
        </div>
      </CardContent>
    </Card>
  )
}
