import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@workspaceModules': path.resolve(__dirname, './src/modules/workspace/modules'),
            '@modules': path.resolve(__dirname, './src/modules'),
            '@config': path.resolve(__dirname, './src/config'),
            '@shared': path.resolve(__dirname, './src/shared'),
            '@stores': path.resolve(__dirname, './src/stores'),
        },
    },
    server: {
        port: parseInt(process.env.VITE_PORT || '3001'),
        host: '0.0.0.0',
        allowedHosts: true,
        hmr: process.env.VITE_HMR_HOST && process.env.VITE_HMR_HOST.trim() ? {
            protocol: 'wss',
            host: process.env.VITE_HMR_HOST,
            port: parseInt(process.env.VITE_PORT || '3001')
        } : false,
        proxy: {
            '/ws': {
                target: 'http://11.0.11.37:3000',
                ws: true,
                changeOrigin: true,
            },
            '/api': {
                target: 'http://11.0.11.37:3000',
                changeOrigin: true,
            }
        }
    }
})
