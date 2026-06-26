const CACHE_NAME = 'clark-nova-v40';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/audio/COMType_Typewriter%20Single%20Strike%201%20DPA4060_PMSFX_CWT.wav',
  '/audio/COMType_Typewriter%20Space%20Spacebar%2066%20DPA4060_PMSFX_CWT.wav',
  '/audio/COMType_Typewriter%20Backspace%2081%20DPA4060_PMSFX_CWT.wav',
  '/audio/COMType_Typewriter%20Carriage%20Return%20Movement%20105%20DPA4060_PMSFX_CWT.wav',
  '/audio/COMType_Typewriter%20Bell%20223%20DPA4060_PMSFX_CWT.wav',
  '/audio/COMType_Typewriter%20Shit%20Press%20Release%2036%20DPA4060_PMSFX_CWT.wav',
  '/audio/COMType_Typewriter%20Shit%20Press%20Release%2037%20DPA4060_PMSFX_CWT.wav',
  '/audio/COMType_Typewritter%20Roller%20Knob%20Movement%20208%20DPA4060_PMSFX_CWT.wav',
  '/audio/COMType_Typewritter%20Lever%20182%20DPA4060_PMSFX_CWT.wav',
  'https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Special+Elite&family=EB+Garamond:ital,wght@1,500;1,700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache font files and audio files on first fetch
        if (response.ok && (event.request.url.includes('fonts.gstatic.com') || event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('/audio/'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
