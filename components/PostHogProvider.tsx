"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env['NEXT_PUBLIC_POSTHOG_KEY'] || 'phc_hUYGVIW2kX78372Y616GgfGm6cbecW0Q2vX7jVcqH6Z', {
      api_host: process.env['NEXT_PUBLIC_POSTHOG_HOST'] || 'https://us.i.posthog.com',
      ui_host: "https://us.posthog.com",
      person_profiles: 'identified_only', // Only create profiles for logged-in users
      defaults: '2025-11-30', // Updated to match PostHog config
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      capture_exceptions: true,
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: {
          password: true,
          email: true,
        },
      },
      debug: process.env['NODE_ENV'] === "development",
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}
