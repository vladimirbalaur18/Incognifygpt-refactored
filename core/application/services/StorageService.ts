export interface IStorageService{
    get: <T>(key: string) => Promise<T | undefined>
    set: <T>(key: string, value:T) => Promise<void>
}

export class StorageError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = 'StorageError';
    }
}

export class StorageService implements IStorageService {

    public async get<T>(key: string): Promise<T | undefined> {
        try {
            const result = await browser.storage.local.get(key);
            return result[key] as T | undefined;
        } catch (error) {
            console.error('Failed to get data from storage:', error);
            throw new StorageError(`Failed to get data for key '${key}'`, error);
        }
    }

    public async set<T>(key: string, value: T): Promise<void> {
        try {
            await browser.storage.local.set({ [key]: value });
        } catch (error) {
            console.error('Failed to save to storage:', error);
            throw new StorageError(`Failed to save data for key '${key}'`, error);
        }
    }
}

export const storageService = new StorageService()