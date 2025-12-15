'use client';

'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary for Dashboard components
 * Catches rendering errors and displays user-friendly fallback with retry option
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // In production, we could send this to an error tracking service
    // For now, we'll safely handle without console.error in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard Error:', error, errorInfo)
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="p-6 sm:p-8 rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-500/20">
              {/* Error Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* Error Message */}
              <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-3 text-center">
                Something went wrong
              </h2>
              <p className="text-gray-300 mb-6 text-center text-sm sm:text-base">
                We encountered an unexpected error while loading the dashboard. Please try again.
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-3 rounded-lg bg-black/40 border border-white/10">
                  <p className="text-xs text-red-300 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* Retry Button */}
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Try Again
              </button>
            </div>

            {/* Additional Help Text */}
            <p className="mt-4 text-center text-sm text-gray-500">
              If the problem persists, please contact support
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
