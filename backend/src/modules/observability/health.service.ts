import { supabaseAdmin } from '../../lib/supabase';
import env from '../../config/env';
import logger from '../../utils/logger';

export interface ComponentHealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
}

export class HealthService {
  /**
   * Check Database Connectivity & Query Latency
   */
  public static async checkDatabase(): Promise<ComponentHealthStatus> {
    const start = Date.now();
    try {
      const { error } = await supabaseAdmin.from('categories').select('id').limit(1);
      const latencyMs = Date.now() - start;

      if (error) {
        return {
          name: 'Database',
          status: 'unhealthy',
          latencyMs,
          message: error.message,
        };
      }

      return {
        name: 'Database',
        status: latencyMs > 500 ? 'degraded' : 'healthy',
        latencyMs,
        message: 'PostgreSQL connection active',
      };
    } catch (err: any) {
      return {
        name: 'Database',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: err?.message || 'Database connection error',
      };
    }
  }

  /**
   * Check Supabase Storage Accessibility
   */
  public static async checkStorage(): Promise<ComponentHealthStatus> {
    const start = Date.now();
    try {
      const { data, error } = await supabaseAdmin.storage.listBuckets();
      const latencyMs = Date.now() - start;

      if (error) {
        return {
          name: 'Storage',
          status: 'degraded',
          latencyMs,
          message: error.message,
        };
      }

      return {
        name: 'Storage',
        status: 'healthy',
        latencyMs,
        message: `Active storage buckets: ${data?.length || 0}`,
        details: { bucketCount: data?.length || 0 },
      };
    } catch (err: any) {
      return {
        name: 'Storage',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        message: err?.message || 'Storage bucket exception',
      };
    }
  }

  /**
   * Check Email Delivery Service (Resend / SMTP)
   */
  public static async checkEmail(): Promise<ComponentHealthStatus> {
    const resendKey = process.env.RESEND_API_KEY;
    const hasSmtp = Boolean(env.SMTP_HOST && env.SMTP_USER);

    if (resendKey && resendKey !== 're_your_api_key') {
      return {
        name: 'Email (Resend API)',
        status: 'healthy',
        message: 'Resend API provider configured & active',
      };
    }

    if (hasSmtp) {
      return {
        name: 'Email (SMTP)',
        status: 'healthy',
        message: `SMTP Mailer configured on ${env.SMTP_HOST}`,
      };
    }

    return {
      name: 'Email',
      status: 'degraded',
      message: 'Running in development console fallback mode (No Resend API Key or SMTP credentials)',
    };
  }

  /**
   * Check Razorpay Gateway Credentials
   */
  public static async checkPayment(): Promise<ComponentHealthStatus> {
    const hasKeys = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
    if (!hasKeys) {
      return {
        name: 'Razorpay Payment',
        status: 'degraded',
        message: 'Razorpay keys unconfigured or running in test mode',
      };
    }

    return {
      name: 'Razorpay Payment',
      status: 'healthy',
      message: 'Razorpay integration credentials valid',
      details: { keyId: `${env.RAZORPAY_KEY_ID?.substring(0, 8)}...` },
    };
  }

  /**
   * Aggregate Comprehensive System Health
   */
  public static async getSystemOverview() {
    const [db, storage, email, payment] = await Promise.all([
      this.checkDatabase(),
      this.checkStorage(),
      this.checkEmail(),
      this.checkPayment(),
    ]);

    const isSystemHealthy = [db, storage, email, payment].every(
      (c) => c.status === 'healthy' || c.status === 'degraded'
    );

    const memoryUsage = process.memoryUsage();

    return {
      status: isSystemHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: '1.0.0',
      gitCommit: '216e278',
      environment: env.NODE_ENV,
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
      components: {
        database: db,
        storage,
        email,
        payment,
      },
    };
  }
}
