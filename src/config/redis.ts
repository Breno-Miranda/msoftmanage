import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';

export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

/**
 * Cache Wrapper pragmático para o projeto MSOFT
 */
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    },

    async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    },

    async del(key: string): Promise<void> {
        await redis.del(key);
    },

    async flush(): Promise<void> {
        await redis.flushall();
    }
};
