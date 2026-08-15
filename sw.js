// sw.js | إلغاء تسجيل Service Worker القديم | Self-unregistering service worker
// كان هذا الملف يحمّل سكريبت إعلانات خارجي (Monetag). حذف الملف لا يكفي:
// المتصفحات التي سجّلت النسخة القديمة تبقى تشغّلها، لذلك نستبدله بنسخة تلغي نفسها.
// The previous version of this file bootstrapped a third-party ad worker. Deleting it is not
// enough: browsers that already registered it keep running the cached copy, so this version
// unregisters itself, clears its caches and reloads open tabs. Safe to delete in a few months.

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(function (key) { return caches.delete(key); }));

      const subscription = await self.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    } catch (error) {
      // لا يمنع فشل التنظيف إلغاء التسجيل | cleanup failure must not block unregister
    }

    await self.registration.unregister();

    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(function (client) {
      client.navigate(client.url);
    });
  })());
});
