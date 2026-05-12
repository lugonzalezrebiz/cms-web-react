import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Prefer explicit proxy host; otherwise infer from absolute VITE_URL_API.
  const proxyTarget =
    env.VITE_HOST ||
    (() => {
      const apiUrl = env.VITE_URL_API
      if (!apiUrl) return undefined
      if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
        return new URL(apiUrl).origin
      }
      return undefined
    })()

  return {
    plugins: [react()],
    base: './',
    server: {
      proxy: proxyTarget
        ? {
            '^/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
  }
})
