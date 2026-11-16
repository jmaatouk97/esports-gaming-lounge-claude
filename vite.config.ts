import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ base: '/esports-gaming-lounge-claude/', plugins: [react()], build: { chunkSizeWarningLimit: 1500 } })
