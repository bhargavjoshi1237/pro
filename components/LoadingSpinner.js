export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg className="animate-spin" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4" 
          fill="none" 
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
        />
      </svg>
    </div>
  );
}

export function LoadingDots({ className = '' }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
}

export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#191919] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" className="text-blue-600 dark:text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-lg">{message}</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#212121] p-6 rounded-2xl border border-gray-200 dark:border-[#2a2a2a] animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-[#2a2a2a] rounded-lg"></div>
        <div className="w-6 h-6 bg-gray-200 dark:bg-[#2a2a2a] rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-[#2a2a2a] rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-2 animate-pulse">
          <div className="w-4 h-4 bg-gray-200 dark:bg-[#2a2a2a] rounded"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 dark:bg-[#2a2a2a] rounded w-3/4 mb-1"></div>
            <div className="h-2 bg-gray-200 dark:bg-[#2a2a2a] rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
