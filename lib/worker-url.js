export const WORKER_URL = (process.env.RAILWAY_WORKER_URL ||
    (process.env.NODE_ENV === 'production'
        ? 'https://telegram-worker-production-90be.up.railway.app'
        : 'http://localhost:5000')
).trim().replace(/\/$/, '');
