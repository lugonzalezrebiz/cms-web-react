import { useEffect, useRef } from "react";

const CHANNEL_NAME = "punches-sync";

type History<S, E> = { present: S; past: E[]; future: E[] };

type Message<S, E> =
  | { key: string; type: "request" }
  | ({ key: string; type: "state" } & History<S, E>);

// Keeps a punches store (state + undo/redo history) the same in the main
// Monitor window and the popout timeline: every local change is sent to the
// other window, and a window that opens asks for the current one. What was
// just received isn't sent back, and an untouched store (nothing done yet)
// is never sent, so opening the popout can't wipe the main window's data.
export const usePunchHistorySync = <S, E>({
  key,
  present,
  past,
  future,
  initialPresent,
  apply,
}: History<S, E> & {
  /** Tells this store's messages apart from other stores'. */
  key: string;
  /** The store's initial state: with no history it means nothing to share. */
  initialPresent: S;
  /** Replaces the local store with one received from the other window. */
  apply: (history: History<S, E>) => void;
}) => {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastReceivedRef = useRef<History<S, E> | null>(null);
  const latestRef = useRef<History<S, E>>({ present, past, future });
  const applyRef = useRef(apply);
  useEffect(() => {
    latestRef.current = { present, past, future };
    applyRef.current = apply;
  });

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    channel.addEventListener("message", (e: MessageEvent<Message<S, E>>) => {
      const message = e.data;
      if (message?.key !== key) return;
      if (message.type === "request") {
        const latest = latestRef.current;
        if (
          latest.present === initialPresent &&
          latest.past.length === 0 &&
          latest.future.length === 0
        )
          return;
        channel.postMessage({ key, type: "state", ...latest });
        return;
      }
      const received = {
        present: message.present,
        past: message.past,
        future: message.future,
      };
      lastReceivedRef.current = received;
      applyRef.current(received);
    });
    channel.postMessage({ key, type: "request" });
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [key, initialPresent]);

  useEffect(() => {
    const received = lastReceivedRef.current;
    if (
      received &&
      received.present === present &&
      received.past === past &&
      received.future === future
    )
      return;
    if (present === initialPresent && past.length === 0 && future.length === 0)
      return;
    channelRef.current?.postMessage({ key, type: "state", present, past, future });
  }, [key, present, past, future, initialPresent]);
};
