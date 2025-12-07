'use client'

/**
 * Loading skeleton for Dashboard with Tailwind animate-pulse
 * Responsive design matching the dark theme of the dashboard
 */
export function DashboardLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-6 sm:py-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="h-8 sm:h-10 bg-white/10 rounded-lg w-48 sm:w-64 mb-2" />
            <div className="h-4 bg-white/5 rounded w-32 sm:w-40" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 bg-white/10 rounded-lg w-28" />
            <div className="h-10 bg-white/10 rounded-lg w-20" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 sm:p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10" />
                <div className="h-4 bg-white/10 rounded w-20 sm:w-24" />
              </div>
              <div className="h-8 sm:h-10 bg-white/10 rounded w-12 sm:w-16 mb-2" />
              <div className="h-3 bg-white/5 rounded w-24 sm:w-32" />
            </div>
          ))}
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - RFQs and Quotes (2/3 width) */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Incoming RFQs Section Skeleton */}
            <div>
              <div className="h-7 sm:h-8 bg-white/10 rounded w-40 mb-4" />
              <div className="p-6 sm:p-8 rounded-xl bg-white/5 border border-white/10 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                    <div className="h-9 bg-white/10 rounded-lg w-24 ml-4" />
                  </div>
                ))}
              </div>
            </div>

            {/* My Quotes Section Skeleton */}
            <div>
              <div className="h-7 sm:h-8 bg-white/10 rounded w-32 mb-4" />
              <div className="p-6 sm:p-8 rounded-xl bg-white/5 border border-white/10 space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-white/10 rounded w-2/3" />
                      <div className="h-3 bg-white/5 rounded w-1/3" />
                    </div>
                    <div className="h-6 bg-white/10 rounded-full w-20 ml-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="h-7 sm:h-8 bg-white/10 rounded w-36 mb-4" />
            <div className="space-y-3 sm:space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>

            {/* Profile Completeness Widget Skeleton */}
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="h-4 bg-white/10 rounded w-40 mb-3" />
              <div className="w-full bg-white/10 rounded-full h-2 mb-2" />
              <div className="h-3 bg-white/5 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
