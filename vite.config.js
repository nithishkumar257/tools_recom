import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('@supabase/supabase-js')) return 'supabase'
          if (id.includes('react-router') || id.includes('@remix-run/router')) return 'router'
          if (id.includes('react-icons')) return 'icons'
          if (id.includes('react-dom')) return 'react-dom'
          if (id.includes('react')) return 'react'

          return 'vendor'
        },
      },
    },
  },
})
