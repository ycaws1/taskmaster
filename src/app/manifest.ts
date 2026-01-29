import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'TaskMaster Todo App',
        short_name: 'TaskMaster',
        description: 'A collaborative todo application',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4f46e5',
        icons: [
            {
                src: '/android-chrome-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/android-chrome-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
