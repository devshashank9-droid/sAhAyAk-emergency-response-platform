import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'sAhAyAk Emergency SOS',
    short_name: 'sAhAyAk',
    description: 'Instant emergency response and volunteer dispatch platform.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    icons: [
      {
        src: '/icon512_maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon512_rounded.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
  }
}