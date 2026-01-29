self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.', event.data);

    if (!event.data) {
        console.log('[Service Worker] No data in push event');
        return;
    }

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        console.error('[Service Worker] Error parsing push data', e);
        data = { title: 'Notification', body: event.data.text() };
    }

    console.log('[Service Worker] Push data:', data);

    const options = {
        body: data.body,
        icon: data.icon || '/android-chrome-192x192.png',
        badge: '/android-chrome-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1,
            url: data.url || '/'
        },
        // Actions can sometimes cause issues if not supported, keeping it simple
        requireInteraction: true // Keeps notification on screen until user interacts
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
            .then(() => console.log('[Service Worker] Notification shown'))
            .catch(err => console.error('[Service Worker] Error showing notification:', err))
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
