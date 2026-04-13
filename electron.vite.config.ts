import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
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
                    target: "https://cmsweb.rebiz.com",
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
});
