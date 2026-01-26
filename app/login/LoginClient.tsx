"use client";

import { signIn } from "next-auth/react"
import Link from "next/link";
import Image from "next/image";
import TrustBadges from "../components/TrustBadges";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams?.get("registered") === "true") {
      setRegistrationSuccess(true);
    }
    
    // Check for OAuth errors in URL
    const errorParam = searchParams?.get("error");
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        OAuthAccountNotLinked: "This email is already registered with a different provider. Please use the original sign-in method.",
        OAuthCallback: "Authentication failed. Please try again.",
        default: "Authentication failed. Please try again."
      };
      setError(errorMessages[errorParam] || errorMessages.default);
    }
  }, [searchParams]);

  const handleSignIn = async (provider: "microsoft-entra-id" | "google" | "linkedin") => {
    try {
      await signIn(provider, { callbackUrl: "/dashboard" })
    } catch (err) {
      console.error(`Sign in with ${provider} failed:`, err);
      setError("Authentication failed. Please try again.");
    }
  };

  return (
    <div className="auth-page-premium">
      {/* Animated gradient background */}
      <div className="auth-bg-gradient" />

      {/* Floating decorative orbs */}
      <div className="auth-deco-orb auth-deco-orb-1" />
      <div className="auth-deco-orb auth-deco-orb-2" />
      <div className="auth-deco-orb auth-deco-orb-3" />

      {/* Floating particles */}
      <div className="floating-particles">
        <div className="floating-particle" />
        <div className="floating-particle" />
        <div className="floating-particle" />
        <div className="floating-particle" />
      </div>

      <div className="relative z-10 py-14">
        <div className="gc-container max-w-[520px]">
          {/* Logo / Header */}
          <div className="text-center mb-10 section-fade-in">
            <div className="logo-glow-container inline-block mb-4">
              <Image
                src="/brand/logo-main.png"
                alt="GreenChainz"
                width={220}
                height={52}
                priority
                className="h-14 w-auto mx-auto drop-shadow-lg"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-black mb-2">
              <span className="text-aurora">Welcome Back</span>
            </h1>
            <p className="text-base text-slate-600">
              The trust layer for sustainable commerce
            </p>
          </div>

          {/* Login Card */}
          <div className="auth-card-premium p-8 md:p-10 section-fade-in section-delay-1">
            {/* Title */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 mb-4">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">Secure Sign In</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Choose Your Sign-In Method
              </h2>
            </div>

            {/* Success Message (from Registration) */}
            {registrationSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-emerald-800 text-sm animate-fade-in-up">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                <span>Account created successfully! Please sign in.</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Microsoft Sign In Button - Primary */}
            <button
              onClick={() => handleSignIn("microsoft-entra-id")}
              className="auth-btn-premium auth-btn-microsoft group mb-4"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
              </svg>
              <span>Continue with Microsoft</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Google Sign In Button */}
            <button
              onClick={() => handleSignIn("google")}
              className="auth-btn-premium auth-btn-google mb-4"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* LinkedIn Sign In Button */}
            <button
              onClick={() => handleSignIn("linkedin")}
              className="auth-btn-premium auth-btn-linkedin mb-6"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span>Continue with LinkedIn</span>
            </button>

            {/* New user info */}
            <div className="mt-6 text-center pt-5 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-emerald-600">New to GreenChainz?</span>{" "}
                <Link href="/signup" className="text-emerald-700 font-bold hover:underline">
                  Create your account
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center section-fade-in section-delay-2">
            <p className="text-xs text-slate-500">
              By signing in, you agree to our{" "}
              <a href="/legal/terms" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/legal/privacy" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 section-fade-in section-delay-3">
            <TrustBadges variant="compact" size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
