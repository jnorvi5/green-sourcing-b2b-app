/**
 * Authentication helpers for API routes
 * Uses NextAuth for session management
 */

import { auth } from "@/app/app.auth"
import { NextResponse } from "next/server"

/**
 * Get the authenticated user from the session
 * Returns user info or null if not authenticated
 */
export async function getAuthUser() {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }
  
  return {
    userId: session.user.id,
    email: session.user.email || "",
    role: session.user.role || "user",
  }
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorizedResponse(message = "Authentication required"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Create a 403 Forbidden response
 */
export function forbiddenResponse(message = "Insufficient permissions"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Check if user has required role
 */
export function hasRole(user: { role: string } | null, requiredRole: string): boolean {
  if (!user) return false
  
  // Role hierarchy: user > supplier > architect > admin
  const roleHierarchy = ["user", "supplier", "architect", "admin"]
  const userRoleIndex = roleHierarchy.indexOf(user.role?.toLowerCase() || "user")
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole.toLowerCase())
  
  return userRoleIndex >= requiredRoleIndex
}
