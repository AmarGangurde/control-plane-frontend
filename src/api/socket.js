import { io } from 'socket.io-client';
import { API_BASE } from './client';

const SOCKET_URL = (API_BASE && API_BASE !== 'undefined')
    ? API_BASE.replace('/api', '')  // strip /api, e.g. https://wrexer.com
    : window.location.origin;        // same-origin in dev

// Singleton socket — created once, reused across the app
export const socket = io(SOCKET_URL, {
    path: '/socket.io',
    autoConnect: false,        // we manually connect when the user logs in
    withCredentials: true,     // sends the HttpOnly session cookie for auth
    transports: ['websocket'], // skip long-polling for performance
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
});

socket.on('connect_error', (err) => {
    console.warn('[Socket.io] Connection error:', err.message);
});
