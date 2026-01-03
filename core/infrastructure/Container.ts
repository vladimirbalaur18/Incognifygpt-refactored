/**
 * Simple Dependency Injection Container
 * Provides a centralized way to manage and resolve dependencies
 */
export class Container {
    private services = new Map<string, () => unknown>();
    private singletons = new Map<string, unknown>();

    /**
     * Register a factory function for a service
     * @param key - Unique identifier for the service
     * @param factory - Factory function that creates the service instance
     * @param singleton - If true, the service will be created once and reused
     */
    register<T>(key: string, factory: () => T, singleton: boolean = true): void {
        if (singleton) {
            this.services.set(key, () => {
                if (!this.singletons.has(key)) {
                    this.singletons.set(key, factory());
                }
                return this.singletons.get(key);
            });
        } else {
            this.services.set(key, factory);
        }
    }

    /**
     * Resolve a service by its key
     * @param key - The service identifier
     * @returns The service instance
     * @throws Error if service is not registered
     */
    resolve<T>(key: string): T {
        const factory = this.services.get(key);
        if (!factory) {
            throw new Error(`Service '${key}' is not registered in the container`);
        }
        return factory() as T;
    }

    /**
     * Check if a service is registered
     */
    has(key: string): boolean {
        return this.services.has(key);
    }

    /**
     * Clear all registered services (useful for testing)
     */
    clear(): void {
        this.services.clear();
        this.singletons.clear();
    }
}

