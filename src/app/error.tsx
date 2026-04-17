'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[Root Error Boundary]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 max-w-md">
        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-6">
          {error.message || "An unexpected error occurred while rendering this page."}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
          >
            Reload Page
          </button>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
