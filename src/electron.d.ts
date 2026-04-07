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
            timestamps: (params: {
                company: number;
                location: number;
                date: string;
                camera: number;
            }) => Promise<number[]>;
        };
    }
}
