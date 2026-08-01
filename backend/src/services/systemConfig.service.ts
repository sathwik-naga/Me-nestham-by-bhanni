import logger from '../utils/logger';

export interface SystemFlags {
  isMaintenanceMode: boolean;
  enable2FA: boolean;
  enableInstantSearch: boolean;
  enableRecommendations: boolean;
  enableCoupons: boolean;
}

export class SystemConfigService {
  private static instance: SystemConfigService;
  private flags: SystemFlags = {
    isMaintenanceMode: false,
    enable2FA: true,
    enableInstantSearch: true,
    enableRecommendations: true,
    enableCoupons: true,
  };

  private constructor() {}

  public static getInstance(): SystemConfigService {
    if (!SystemConfigService.instance) {
      SystemConfigService.instance = new SystemConfigService();
    }
    return SystemConfigService.instance;
  }

  public getFlags(): SystemFlags {
    return { ...this.flags };
  }

  public updateFlags(partialFlags: Partial<SystemFlags>): SystemFlags {
    this.flags = { ...this.flags, ...partialFlags };
    logger.info(`SystemConfigService: Updated flags -> Maintenance: ${this.flags.isMaintenanceMode}`);
    return this.getFlags();
  }
}

export const systemConfig = SystemConfigService.getInstance();
