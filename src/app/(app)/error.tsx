"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-6 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-lg font-semibold text-gray-800">Er is iets misgegaan</h2>
        <p className="text-sm text-red-600 bg-red-50 rounded p-3 text-left font-mono break-all">
          {error.message || "Onbekende fout"}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Opnieuw proberen
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
          >
            Naar dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
