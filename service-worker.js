// service-worker.js

// 1. Listen for background push notifications
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "FaithConnect", body: event.data.text() };
    }
  }

  const title = data.title || "New Message on FaithConnect";
  const options = {
    body: data.body || "You have a new activity.",
    icon: "/assets/icon-192.png", // Path to your app icon
    badge: "/assets/icon-192.png",
    data: {
      url: data.url || "/chat.html",
      unreadCount: data.unreadCount || 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Update home screen red dot/badge on supported launchers
      if ('setAppBadge' in navigator) {
        return navigator.setAppBadge(data.unreadCount || 1);
      }
    })
  );
});

// 2. Handle tapping on the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Clear the launcher icon badge on click
  if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge();
  }

  // Open the app or bring existing window into focus
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const targetUrl = event.notification.data.url || '/chat.html';

      for (let client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
