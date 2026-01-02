"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiCpu, FiRefreshCw } from "react-icons/fi";
import { toast } from "sonner";
import { DashboardStats } from "@/types/supplier-dashboard";

interface AiInsightsCardProps {
  stats: DashboardStats;
}

export function AiInsightsCard({ stats }: AiInsightsCardProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Generate on mount

  async function generateInsight() {
    setLoading(true);
    try {
      const response = await fetch("/api/agent/generate-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stats }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate insight");
      }

      const data = await response.json();
      setInsight(data.insight);
    } catch (error) {
      console.error(error);
      // Don't show toast on initial load error to avoid annoyance,
      // but maybe show a fallback UI or "Retry" button.
      setInsight("Unable to generate AI insights at this time. Click refresh to try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
          <FiCpu className="w-5 h-5" />
          AI Performance Insights
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateInsight}
          disabled={loading}
          className="h-8 w-8 p-0"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-indigo-100 dark:bg-indigo-900/50 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-indigo-100 dark:bg-indigo-900/50 rounded w-1/2 animate-pulse" />
          </div>
        ) : (
          <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">
            {insight}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
