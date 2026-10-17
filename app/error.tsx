'use client';

export default function Error({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-neutral-600">
        The page could not load. This is often a temporary problem reaching the
        database.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}
