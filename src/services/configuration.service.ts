import { connectToDatabase } from "@/lib/db";

export interface ConfigurationValue {
  key: string;
  value: string | number | boolean;
  category: string;
  description: string;
  isActive: boolean;
}

export interface PolicyValue {
  name: string;
  type: string;
  value: string | number | boolean;
  description: string;
  isActive: boolean;
}

class ConfigurationService {
  private static instance: ConfigurationService;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() { }

  public static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, value: any): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get a configuration value by key
   */
  async getConfiguration(key: string): Promise<ConfigurationValue | null> {
    const cacheKey = `config_${key}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { db } = await connectToDatabase();
      const config = await db.collection("configurations").findOne({
        key: key.toUpperCase(),
        isActive: true,
      });

      if (config) {
        this.setCache(cacheKey, config);
        return config;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching configuration for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get multiple configurations by category
   */
  async getConfigurationsByCategory(category: string): Promise<ConfigurationValue[]> {
    const cacheKey = `configs_category_${category}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { db } = await connectToDatabase();
      const configs = await db.collection("configurations")
        .find({
          category: category.toLowerCase(),
          isActive: true,
        })
        .toArray();

      this.setCache(cacheKey, configs);
      return configs;
    } catch (error) {
      console.error(`Error fetching configurations for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Get all active configurations
   */
  async getAllConfigurations(): Promise<ConfigurationValue[]> {
    const cacheKey = "all_configs";

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { db } = await connectToDatabase();
      const configs = await db.collection("configurations")
        .find({ isActive: true })
        .sort({ category: 1, key: 1 })
        .toArray();

      this.setCache(cacheKey, configs);
      return configs;
    } catch (error) {
      console.error("Error fetching all configurations:", error);
      return [];
    }
  }

  /**
   * Get a policy configuration by name
   */
  async getPolicy(name: string): Promise<PolicyValue | null> {
    const cacheKey = `policy_${name}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { db } = await connectToDatabase();
      const policy = await db.collection("policy_configurations").findOne({
        name: name.trim(),
        isActive: true,
      });

      if (policy) {
        this.setCache(cacheKey, policy);
        return policy;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching policy for name ${name}:`, error);
      return null;
    }
  }

  /**
   * Get all active policies
   */
  async getAllPolicies(): Promise<PolicyValue[]> {
    const cacheKey = "all_policies";

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { db } = await connectToDatabase();
      const policies = await db.collection("policy_configurations")
        .find({ isActive: true })
        .sort({ name: 1 })
        .toArray();

      this.setCache(cacheKey, policies);
      return policies;
    } catch (error) {
      console.error("Error fetching all policies:", error);
      return [];
    }
  }

  /**
   * Get policies by type
   */
  async getPoliciesByType(type: string): Promise<PolicyValue[]> {
    const cacheKey = `policies_type_${type}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const { db } = await connectToDatabase();
      const policies = await db.collection("policy_configurations")
        .find({
          type: type.toLowerCase(),
          isActive: true,
        })
        .sort({ name: 1 })
        .toArray();

      this.setCache(cacheKey, policies);
      return policies;
    } catch (error) {
      console.error(`Error fetching policies for type ${type}:`, error);
      return [];
    }
  }

  /**
   * Set a configuration value
   */
  async setConfiguration(
    key: string,
    value: string | number | boolean,
    category: string,
    description: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { db } = await connectToDatabase();

      const result = await db.collection("configurations").updateOne(
        { key: key.toUpperCase() },
        {
          $set: {
            value,
            category: category.toLowerCase(),
            description,
            updatedAt: new Date(),
            updatedBy: userId,
          },
        },
        { upsert: true }
      );

      if (result.modifiedCount > 0 || result.upsertedCount > 0) {
        this.clearCache(); // Clear cache when configuration is updated
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error setting configuration for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set a policy configuration
   */
  async setPolicy(
    name: string,
    type: string,
    value: string | number | boolean,
    description: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { db } = await connectToDatabase();

      const result = await db.collection("policy_configurations").updateOne(
        { name: name.trim() },
        {
          $set: {
            type: type.toLowerCase(),
            value,
            description,
            updatedAt: new Date(),
            updatedBy: userId,
          },
        },
        { upsert: true }
      );

      if (result.modifiedCount > 0 || result.upsertedCount > 0) {
        this.clearCache(); // Clear cache when policy is updated
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error setting policy for name ${name}:`, error);
      return false;
    }
  }

  /**
   * Get configuration value with fallback
   */
  async getConfigValue(key: string, fallback?: any): Promise<any> {
    const config = await this.getConfiguration(key);
    return config ? config.value : fallback;
  }

  /**
   * Get policy value with fallback
   */
  async getPolicyValue(name: string, fallback?: any): Promise<any> {
    const policy = await this.getPolicy(name);
    return policy ? policy.value : fallback;
  }

  /**
   * Check if a configuration exists and is active
   */
  async hasConfiguration(key: string): Promise<boolean> {
    const config = await this.getConfiguration(key);
    return config !== null;
  }

  /**
   * Check if a policy exists and is active
   */
  async hasPolicy(name: string): Promise<boolean> {
    const policy = await this.getPolicy(name);
    return policy !== null;
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.clearCache();
  }
}

export const configurationService = ConfigurationService.getInstance();