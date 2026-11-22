/* Lounge 서비스 워커 (2026-11-20, 파트너 홈 화면 설치·푸시).
   하는 일은 푸시 알림을 띄우고, 누르면 앱을 여는 것뿐이다.
   파일을 담아 두지 않는다(fetch 를 가로채지 않는다) - 담아 두면 배포한 새 화면 대신 옛 화면이 뜬다. */
self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) { data = {} }
  const title = typeof data.title === 'string' && data.title ? data.title.slice(0, 80) : 'Lounge'
  const body = typeof data.body === 'string' && data.body ? data.body.slice(0, 240) : '새 알림이 있습니다'
  /* 갈 곳은 우리 앱 안의 경로(#/…)만 받는다 */
  const path = typeof data.path === 'string' && /^#\/[\w\-/?=&%.]*$/.test(data.path) ? data.path : ''
  event.waitUntil(self.registration.showNotification(title, {
    body, icon: '/lounge-app-192.png', badge: '/lounge-app-192.png', tag: typeof data.tag === 'string' ? data.tag.slice(0, 60) : undefined,
    data: { path },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = (event.notification.data && event.notification.data.path) || ''
  const url = self.location.origin + '/' + path
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if (c.url.startsWith(self.location.origin) && 'focus' in c) {
        if (path && 'navigate' in c) return c.navigate(url).then((w) => (w || c).focus()).catch(() => self.clients.openWindow(url))
        return c.focus()
      }
    }
    return self.clients.openWindow(url)
  }))
})
