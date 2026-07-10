export {};

declare global {
    interface Window {
        api: {
            minimize: () => void;
            maximize: () => void;
            close: () => void;
            homedir: () => Promise<string>;
            cameras: (params: {
                company: number;
                location: number;
                date: string;
            }) => Promise<{ id: number; name: string }[]>;
            dvrBasePath: () => Promise<string>;
            crashContext: () => Promise<Record<string, unknown>>;
            logCrash: (payload: unknown) => Promise<unknown>;
            checkVpn: () => Promise<boolean>;
            timestamps: (params: {
                company: number;
                location: number;
                date: string;
                camera: number;
            }) => Promise<number[]>;

            checkForUpdates: () => Promise<unknown>;
            downloadUpdate: () => Promise<unknown>;
            installUpdate: () => Promise<void>;

            onUpdateAvailable: (callback: (info: unknown) => void) => void;
            onUpdateProgress: (
                callback: (progress: { percent: number }) => void,
            ) => void;
            onUpdateDownloaded: (callback: (info: unknown) => void) => void;
            onUpdateError: (
                callback: (error: { message: string }) => void,
            ) => void;
        };
    }
}
