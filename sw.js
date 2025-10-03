// Service Worker for QLA Mathematics Portal
// Version 1.0.0 - Provides offline capabilities and performance optimization

const CACHE_VERSION = 'qla-math-v1.0.0';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_IMAGES = `${CACHE_VERSION}-images`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/js/portal.js',
  '/manifest.json',
  '/assets/qla_logo.png',
  '/assets/qla_logo.svg',
  '/assets/qla_banner.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Poppins:wght@600;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Network-first resources (lesson files)
const NETWORK_FIRST = [
  /\/grade[78]\/lesson-\d+\.html$/,
  /\/grade[78]\/welcome.*\.html$/
];

// Cache-first resources (images, fonts, static assets)
const CACHE_FIRST = [
  /\.(png|jpg|jpeg|svg|gif|webp)$/,
  /\.(woff|woff2|ttf|eot)$/,
  /\/assets\//
];

// ==================== Installation ====================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Installation failed:', err))
  );
});

// ==================== Activation ====================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        // Delete old caches
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('qla-math-') && name !== CACHE_STATIC && name !== CACHE_DYNAMIC && name !== CACHE_IMAGES)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ==================== Fetch Handling ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different request types
  if (isNetworkFirst(url)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (isCacheFirst(url)) {
    event.respondWith(cacheFirstStrategy(request));
  } else {
    event.respondWith(cacheFirstStrategy(request));
  }
});

// ==================== Caching Strategies ====================

// Network-first: Try network, fall back to cache
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_DYNAMIC);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response(
        getOfflinePage(),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    throw error;
  }
}

// Cache-first: Try cache, fall back to network
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Optionally update cache in background
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cacheName = request.url.match(/\.(png|jpg|jpeg|svg|gif|webp)$/) 
        ? CACHE_IMAGES 
        : CACHE_DYNAMIC;
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// Update cache in background (stale-while-revalidate pattern)
function updateCacheInBackground(request) {
  fetch(request)
    .then(response => {
      if (response.ok) {
        caches.open(CACHE_DYNAMIC)
          .then(cache => cache.put(request, response));
      }
    })
    .catch(() => {
      // Silently fail background updates
    });
}

// ==================== Helper Functions ====================

function isNetworkFirst(url) {
  return NETWORK_FIRST.some(pattern => pattern.test(url.pathname));
}

function isCacheFirst(url) {
  return CACHE_FIRST.some(pattern => pattern.test(url.pathname));
}

function getOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>Offline - QLA Mathematics</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          background: linear-gradient(135deg, #6C1D45 0%, #8B2450 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          text-align: center;
        }
        .container {
          max-width: 500px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.1rem; line-height: 1.6; margin-bottom: 1.5rem; opacity: 0.9; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        button {
          background: #C7A34F;
          color: #6C1D45;
          border: none;
          padding: 12px 24px;
          font-size: 1rem;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        button:hover { transform: scale(1.05); }
        .cached-lessons {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.2);
        }
        .cached-lessons h2 { font-size: 1.2rem; margin-bottom: 1rem; }
        .lesson-link {
          display: block;
          color: #C7A34F;
          text-decoration: none;
          padding: 8px;
          margin: 4px 0;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .lesson-link:hover { background: rgba(255,255,255,0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>You're Offline</h1>
        <p>It looks like you don't have an internet connection right now. Don't worry, you can still access lessons you've visited before!</p>
        <button onclick="window.location.reload()">Try Again</button>
        
        <div class="cached-lessons">
          <h2>Recently Accessed Lessons</h2>
          <p style="font-size: 0.9rem; opacity: 0.8;">Check your browser's back button or return to the home page when online.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==================== Background Sync ====================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  // Placeholder for syncing analytics data when back online
  console.log('[SW] Syncing analytics data');
}

// ==================== Push Notifications ====================
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New lesson available!',
    icon: '/assets/qla_logo_192.png',
    badge: '/assets/badge-icon.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Lesson',
        icon: '/assets/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('QLA Mathematics', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// ==================== Message Handling ====================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(names => {
        return Promise.all(
          names.map(name => caches.delete(name))
        );
      })
    );
  }
});

console.log('[SW] Service worker loaded');
