'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

type AnnounceOptions = {
  focus?: boolean;
};

type QueueFeedback = {
  announce: (message: string, options?: AnnounceOptions) => void;
  openConfirmId: string | null;
  setOpenConfirmId: (id: string | null) => void;
};

const QueueFeedbackContext = createContext<QueueFeedback | null>(null);

export function useQueueFeedback() {
  const feedback = useContext(QueueFeedbackContext);

  if (!feedback) {
    throw new Error('useQueueFeedback needs a QueueFeedbackProvider above it.');
  }

  return feedback;
}

// The rows are server rendered, so this provider sits above them and only
// carries the two values a row cannot own: the live line and the one open
// confirm. Children pass straight through.
export function QueueFeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [openConfirmId, setOpenConfirmId] = useState<string | null>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const announce = useCallback((next: string, options?: AnnounceOptions) => {
    setMessage(next);

    if (options?.focus) {
      liveRef.current?.focus();
    }
  }, []);

  const value = useMemo(
    () => ({ announce, openConfirmId, setOpenConfirmId }),
    [announce, openConfirmId],
  );

  return (
    <QueueFeedbackContext.Provider value={value}>
      <div className="flex flex-col gap-4">
        <p
          ref={liveRef}
          role="status"
          aria-live="polite"
          tabIndex={-1}
          className="min-h-5 rounded-lg px-1 text-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {message}
        </p>
        {children}
      </div>
    </QueueFeedbackContext.Provider>
  );
}
