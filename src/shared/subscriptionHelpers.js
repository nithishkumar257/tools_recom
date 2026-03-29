export function createEventSourceSubscription(url, { eventName, onEvent, onError }) {
  if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
    return () => {};
  }

  const source = new EventSource(url);

  source.addEventListener(eventName, (event) => {
    onEvent?.(event);
  });

  source.addEventListener('error', () => {
    onError?.();
    source.close();
  });

  return () => source.close();
}

export function createReconnectableWebSocketSubscription({ createUrl, onMessage, onError, reconnectDelayMs = 3000 }) {
  if (typeof window === 'undefined' || typeof window.WebSocket === 'undefined') {
    return () => {};
  }

  let closed = false;
  let reconnectTimer = null;
  let socket = null;

  const connect = () => {
    socket = new window.WebSocket(createUrl());

    socket.onmessage = (event) => {
      onMessage?.(event);
    };

    socket.onerror = () => {
      onError?.();
    };

    socket.onclose = () => {
      if (closed) return;
      reconnectTimer = window.setTimeout(connect, reconnectDelayMs);
    };
  };

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket && socket.readyState === window.WebSocket.OPEN) {
      socket.close();
    }
  };
}
