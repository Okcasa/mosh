const CACHE_NAME = 'mosh-v2';
const ASSETS = [
    '/',
    'index.html',
    'player.html',
    'style.css',
    'script.js',
    'player.js',
    'manifest.json',
    '../ChatGPT_Image_Jan_30__2026__07_58_23_PM-removebg-preview.png'
];

// Install Event - Caching basic assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate Event - Cleaning old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

// Fetch Event - Stale-while-revalidate strategy
self.addEventListener('fetch', (e) => {
    // Only cache GET requests
    if (e.request.method !== 'GET') return;

    // Skip internal API calls or external dynamic data if needed, 
    // but here we try to cache images from IMDb
    const isImage = e.request.destination === 'image';
    const isStatic = ASSETS.some(asset => e.request.url.includes(asset));

    if (isStatic || isImage) {
        e.respondWith(
            caches.match(e.request).then((cachedResponse) => {
                const fetchedResponse = fetch(e.request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, networkResponse.clone());
                        return networkResponse;
                    });
                }).catch(() => {});

                return cachedResponse || fetchedResponse;
            })
        );
    } else {
        e.respondWith(
            caches.match(e.request).then((res) => res || fetch(e.request))
        );
    }
});
