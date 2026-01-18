"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
      <p className="opacity-70">Something went wrong.</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded bg-white text-black"
      >
        Try again
      </button>
    </main>
  );
}
