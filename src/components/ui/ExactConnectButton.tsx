"use client";

import { useRouter } from "next/navigation";

export default function ExactConnectButton({ large = false }: { large?: boolean }) {
  const router = useRouter();

  function handleConnect() {
    router.push("/api/exact-online/token");
  }

  if (large) {
    return (
      <button
        onClick={handleConnect}
        className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
      >
        Verbinden met Exact Online
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="text-sm bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
    >
      Exact Online koppelen
    </button>
  );
}
