import { defineConfig } from "electron-vite";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode ?? "development", process.cwd(), "");

    return {
        main: {
            build: {
                rollupOptions: {
                    input: {
                        index: resolve(__dirname, "electron/main.ts"),
                    },
                },
            },
        },
        preload: {
            build: {
                rollupOptions: {
                    input: {
                        index: resolve(__dirname, "electron/preload.ts"),
                    },
                    output: {
                        format: "cjs",
                        entryFileNames: "[name].cjs",
                    },
                },
            },
        },
        renderer: {
            plugins: [react()],
            root: resolve(__dirname, "."),
            server: {
                proxy: {
                    "/api": {
                        target: env.VITE_HOST,
                        changeOrigin: true,
                        secure: false,
                    },
                },
            },
            build: {
                rollupOptions: {
                    input: {
                        index: resolve(__dirname, "index.html"),
                    },
                },
            },
        },
    };
});
