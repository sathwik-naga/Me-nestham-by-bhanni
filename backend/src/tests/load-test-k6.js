import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Stage 1: Ramp up to 100 users
    { duration: '1m', target: 500 },   // Stage 2: Ramp up to 500 users
    { duration: '1m', target: 1000 },  // Stage 3: Scale to 1,000 users
    { duration: '30s', target: 5000 },  // Stage 4: Spike test up to 5,000 users
    { duration: '30s', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must complete below 300ms
    http_req_failed: ['rate<0.01'],   // HTTP error rate must be < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:5000';

export default function () {
  // 1. Health check endpoint
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // 2. Fetch categories
  const catRes = http.get(`${BASE_URL}/api/categories`);
  check(catRes, {
    'categories status is 200': (r) => r.status === 200,
  });

  // 3. Fetch products catalog
  const prodRes = http.get(`${BASE_URL}/api/products?page=1&limit=12`);
  check(prodRes, {
    'products status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
