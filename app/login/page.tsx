"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaLinkedin, FaMicrosoft } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { FiEye, FiEyeOff, FiCheckSquare } from "react-icons/fi";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugMode, setDebugMode] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for existing Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // User is already logged in, redirect based on user type
          const userType =
            user.user_metadata?.["user_type"] ||
            user.user_metadata?.["role"] ||
            "architect";
          if (userType === "supplier") {
            router.push("/supplier/dashboard");
          } else {
            router.push("/architect/dashboard");
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (debugMode) {
      logger.info("Login attempt initiated", { email: formData.email });
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include", // Important: include cookies in request
      });

      const data = await response.json();

      if (debugMode) {
        logger.debug("Login response received", { status: response.status, body: data });
      }

      if (response.ok) {
        // Session cookies are set by the API, just redirect
        if (data.user.user_type === "supplier") {
          router.push("/supplier/dashboard");
        } else {
          router.push("/architect/dashboard");
        }
        // Force a refresh to ensure cookies are recognized
        router.refresh();
      } else {
        let errorMsg = data.error || "Login failed";
        if (data.details) {
          if (data.details.msg) errorMsg = data.details.msg;
          if (data.details.error) errorMsg = data.details.error;
          if (data.details.error_code)
            errorMsg += ` (Code: ${data.details.error_code})`;
        }
        setError(errorMsg);
        if (debugMode) {
          logger.warn("Login failed", { details: data.details });
        }
      }
    } catch (err) {
      logger.error("Login exception", { error: err });
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type: "architect" | "supplier") => {
    if (type === "architect") {
      setFormData({
        email: "demo@architect.com",
        password: "demo123",
      });
    } else {
      setFormData({
        email: "demo@supplier.com",
        password: "demo123",
      });
    }
  };

  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      console.error("Google login error:", error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function signInWithGitHub() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("GitHub login error:", error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function signInWithLinkedIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("LinkedIn login error:", error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function signInWithMicrosoft() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "email profile openid",
      },
    });
    if (error) {
      console.error("Microsoft login error:", error);
      setError(error.message);
      setLoading(false);
    }
  }

  // Show loading while checking existing session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-12 opacity-5">
        <div className="w-64 h-64 rounded-full bg-primary blur-3xl"></div>
      </div>
      <div className="absolute bottom-0 left-0 p-12 opacity-5">
        <div className="w-64 h-64 rounded-full bg-emerald-600 blur-3xl"></div>
      </div>

      <Card className="max-w-md w-full shadow-2xl border-border/50 relative z-10">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold text-foreground mb-2">
            Welcome Back
          </CardTitle>
          <CardDescription>Sign in to GreenChainz</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full justify-start gap-3 h-11"
            >
              <FcGoogle className="h-5 w-5" />
              Continue with Google
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={signInWithMicrosoft}
              disabled={loading}
              className="w-full justify-start gap-3 h-11"
            >
              <FaMicrosoft className="h-5 w-5 text-[#00A4EF]" />
              Continue with Microsoft (Azure)
            </Button>

            <Button
              variant="outline" // Changed to outline for consistency, or custom
              type="button"
              onClick={signInWithLinkedIn}
              disabled={loading}
              className="w-full justify-start gap-3 h-11 bg-[#0A66C2] text-white hover:bg-[#004182] border-transparent hover:text-white"
            >
              <FaLinkedin className="h-5 w-5" />
              Continue with LinkedIn
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={signInWithGitHub}
              disabled={loading}
              className="w-full justify-start gap-3 h-11 bg-slate-900 text-white hover:bg-slate-800 border-transparent hover:text-white"
            >
              <FaGithub className="h-5 w-5" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="email"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="demo@architect.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-sm"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                />
                <div className="w-4 h-4 border border-primary rounded flex items-center justify-center peer-checked:bg-primary peer-checked:text-primary-foreground text-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2">
                  <FiCheckSquare className="w-3 h-3" />
                </div>
                {/* Fallback checkbox if custom one is tricky */}
                <span className="text-sm text-muted-foreground">
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3 font-medium">
              DEMO ACCOUNTS
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => fillDemo("architect")}
                disabled={loading}
                size="sm"
                className="text-xs"
              >
                📐 Architect
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => fillDemo("supplier")}
                disabled={loading}
                size="sm"
                className="text-xs"
              >
                🏭 Supplier
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Password: demo123
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-border p-6 bg-muted/20">
          <div className="text-center w-full">
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Debug Toggle */}
          <div className="flex items-center justify-center text-center gap-2 w-full mt-2">
            <button
              type="button"
              onClick={() => setDebugMode(!debugMode)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {debugMode ? "🔍 Debug ON" : "🔍 Debug"}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
