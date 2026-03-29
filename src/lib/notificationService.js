let swRegistrationPromise = null;

function canUseNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function canUseServiceWorker() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

function canUsePushManager() {
  return typeof window !== 'undefined' && 'PushManager' in window;
}

function urlBase64ToUint8Array(base64String = '') {
  const safeInput = String(base64String || '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (safeInput.length % 4)) % 4);
  const encoded = window.atob(`${safeInput}${padding}`);
  const output = new Uint8Array(encoded.length);
  for (let index = 0; index < encoded.length; index += 1) {
    output[index] = encoded.charCodeAt(index);
  }
  return output;
}

export function getNotificationPermission() {
  if (!canUseNotifications()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!canUseNotifications()) return 'unsupported';
  return Notification.requestPermission();
}

export async function registerPushGroundworkServiceWorker() {
  if (!canUseServiceWorker()) return null;
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker.register('/sw.js').catch(() => null);
  }
  return swRegistrationPromise;
}

export function serializePushSubscription(subscription) {
  if (!subscription) return null;
  if (typeof subscription.toJSON === 'function') {
    const value = subscription.toJSON();
    return {
      endpoint: value?.endpoint,
      expirationTime: value?.expirationTime ?? null,
      keys: {
        auth: value?.keys?.auth,
        p256dh: value?.keys?.p256dh,
      },
    };
  }
  return null;
}

export async function ensurePushSubscription() {
  if (getNotificationPermission() !== 'granted') {
    throw new Error('Notification permission is not granted.');
  }

  const registration = await registerPushGroundworkServiceWorker();
  if (!registration) {
    throw new Error('Service worker registration is unavailable.');
  }

  if (!canUsePushManager() || !registration.pushManager) {
    throw new Error('Push subscriptions are not supported in this browser.');
  }

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    const payload = serializePushSubscription(existing);
    if (!payload?.endpoint) {
      throw new Error('Unable to serialize existing push subscription.');
    }
    return payload;
  }

  const publicKey = String(import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || '').trim();
  if (!publicKey) {
    throw new Error('Missing VITE_WEB_PUSH_PUBLIC_KEY for push subscription setup.');
  }

  const nextSubscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const payload = serializePushSubscription(nextSubscription);
  if (!payload?.endpoint) {
    throw new Error('Unable to create push subscription payload.');
  }
  return payload;
}

export async function showLocalNotification({ title, body, tag } = {}) {
  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission is not granted.');
  }

  const safeTitle = String(title || 'RecommenDex');
  const safeBody = String(body || 'You have a new update.');
  const safeTag = String(tag || 'recommendex-local-notification');

  const registration = await registerPushGroundworkServiceWorker();
  if (registration && typeof registration.showNotification === 'function') {
    await registration.showNotification(safeTitle, {
      body: safeBody,
      tag: safeTag,
      icon: '/recommendex-logo.png',
      badge: '/recommendex-logo.png',
      data: { url: '/dashboard' },
    });
    return;
  }

  if (canUseNotifications()) {
    new Notification(safeTitle, { body: safeBody, tag: safeTag });
  }
}