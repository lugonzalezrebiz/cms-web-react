/**
 * electron.d.ts
 * Type declarations for all window.* APIs exposed by preload.js.
 */

export interface EventSubscriber {
  unsubscribe(): void;
}

export interface TLTrack {
  id: number;
  category: string;
  name: string;
  sessions: TLSession[];
  selected?: boolean;
  markers?: TLMarker[];
  employeeID?: number;
}

export interface TLSession {
  type: string;
  timestamp: string;
}

export interface TLMarker {
  id?: string | number;
  timestamp: string;
  ts?: number;
  cameraId?: string;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
}

export interface TLTimes {
  start: string;
  end: string;
  current: string;
  buffer: number;
  interval?: number;
  businessStart: string;
  businessEnd: string;
  actualStart?: string;
  actualEnd?: string;
}

export interface TLUiState {
  panOffsetSec: number;
  zoom: number;
  category: string | null;
  playback: boolean;
  selection?: TLSelection;
}

export interface TLSelection {
  trackId: number | null;
  sessionKeys: string[];
}

export interface TimelineSnapshot {
  torn?: boolean;
  ui?: Partial<TLUiState>;
  timeline?: {
    times?: TLTimes;
    tracks?: TLTrack[];
  };
}

export interface UiPatch {
  zoom?: number;
  panOffsetSec?: number;
  category?: string | null;
  playback?: boolean;
  selection?: TLSelection;
}

export interface AddSessionPayload {
  type: string;
  timestamp: string;
}

export interface UpdateRangePayload {
  startOld: string;
  endOld: string;
  startNew: string;
  endNew: string;
}

export interface AddMarkerPayload {
  timestamp: string;
  ts?: number;
  cameraId?: string;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
}

export interface ClearMarkersAtPayload {
  timestamp: string;
  tolerance: number;
}

declare global {
  interface Window {
    timeline: {
      company(company?: unknown): Promise<number>;
      location(location?: unknown): Promise<number>;
      date(date?: unknown): Promise<string>;
      goto(time: string): Promise<void>;
      first(): Promise<void>;
      back(): Promise<void>;
      next(): Promise<void>;
      last(): Promise<void>;
      play(): Promise<boolean>;
      pause(): Promise<boolean>;
      current(): Promise<string>;
      zoom(level: number): Promise<void>;
      addTrack(track: Omit<TLTrack, "selected">): Promise<boolean>;
      updateTrack(track: TLTrack): Promise<boolean>;
      removeTrack(trackId: number): Promise<boolean>;
      addSession(trackId: number, session: AddSessionPayload): Promise<void>;
      deleteSession(trackId: number, session: AddSessionPayload): Promise<void>;
      updateSession(trackId: number, from: AddSessionPayload, to: AddSessionPayload): Promise<void>;
      updateRange(trackId: number, payload: UpdateRangePayload): Promise<void>;
      cut(trackId: number, range: null, time: string): Promise<void>;
      patch(trackId: number, range: null, time: string): Promise<void>;
      updateTimes(times: Partial<TLTimes>): Promise<void>;
      addMarker(trackId: number, marker: AddMarkerPayload): Promise<void>;
      clearMarkersAt(trackId: number, payload: ClearMarkersAtPayload): Promise<void>;
      torn(): Promise<boolean>;
      detach(): void;
      attach(): void;
      setUi(patch: UiPatch): Promise<void>;
      snapshot(): Promise<TimelineSnapshot>;
      subscribe(event: string, handler: (detail: unknown) => void): EventSubscriber;
    };

    wndhook: {
      minimize(): void;
      maximizeToggle(): void;
      close(): void;
      maximized(cb: (status: boolean) => void): void;
      renderer(): Promise<string>;
      closeAllWindows(): void;
      title(): Promise<string>;
      name(): Promise<string>;
      version(): Promise<string>;
      description(): Promise<string>;
      mode(): Promise<string>;
      decorate(): Promise<boolean>;
      platform(): Promise<string>;
      showAboutWindow(): void;
      showHelpWindow(): void;
      homedir(): Promise<string>;
      canGoBack(): Promise<boolean>;
      goBack(): Promise<void>;
    };

    auth: {
      login(user: { username: string; password: string }): Promise<unknown>;
      logout(): Promise<void>;
      user(): Promise<unknown>;
    };

    wiki: {
      read(reference: string): Promise<string>;
    };

    fs: {
      read(params: { filename: string; mime: string }): Promise<string>;
      write(params: { filename: string; content: string; mime: string }): Promise<void>;
    };

    monitoring: {
      images(payload: unknown): Promise<unknown>;
      ensure(payload: unknown): Promise<void>;
      missing(payload: unknown): Promise<unknown>;
      onEnsureProgress(cb: (payload: unknown) => void): () => void;
      image(params: unknown): Promise<unknown>;
      cameras(params: unknown): Promise<unknown[]>;
    };

    work: {
      ensure(params: { id: number }): Promise<unknown>;
      details(): Promise<unknown>;
    };
  }
}

export {};
