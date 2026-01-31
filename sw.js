const CACHE_NAME = 'mosh-v1';
const ASSETS = [
    'index.html',
    'player.html',
    'style.css',
    'script.js',
    'player.js',
    'manifest.json',
    '../ChatGPT_Image_Jan_30__2026__07_58_23_PM-removebg-preview.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
});
