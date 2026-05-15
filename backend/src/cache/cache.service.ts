import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class CacheService {
  private redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  async set(key: string, value: any) {
    return this.redis.set(key, JSON.stringify(value));
  }

  async get(key: string) {
    const data = await this.redis.get(key);

    if (!data) return null;

    if (typeof data === 'string') {
      return JSON.parse(data);
    }

    return data;
  }

  async del(key: string) {
    return this.redis.del(key);
  }
  
}