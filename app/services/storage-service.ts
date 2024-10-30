import { knownFolders } from '@nativescript/core';
import { WardrobeItem, Outfit } from '../models/wardrobe-item';

export class StorageService {
    private static readonly STORAGE_FILE = 'wardrobe-data.json';
    private static instance: StorageService;

    private constructor() {}

    static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    async saveItem(item: WardrobeItem): Promise<void> {
        const items = await this.getItems();
        items.push(item);
        await this.saveData('items', items);
    }

    async getItems(): Promise<WardrobeItem[]> {
        return await this.getData('items', []);
    }

    async saveOutfit(outfit: Outfit): Promise<void> {
        const outfits = await this.getOutfits();
        outfits.unshift(outfit);
        await this.saveData('outfits', outfits);
    }

    async getOutfits(): Promise<Outfit[]> {
        return await this.getData('outfits', []);
    }

    private async getData<T>(key: string, defaultValue: T): Promise<T> {
        try {
            const documents = knownFolders.documents();
            const file = documents.getFile(StorageService.STORAGE_FILE);
            const content = await file.readText();
            const data = JSON.parse(content);
            return data[key] || defaultValue;
        } catch {
            return defaultValue;
        }
    }

    private async saveData(key: string, data: any): Promise<void> {
        try {
            const documents = knownFolders.documents();
            const file = documents.getFile(StorageService.STORAGE_FILE);
            const existingContent = await file.readText().catch(() => '{}');
            const existingData = JSON.parse(existingContent);
            const newData = { ...existingData, [key]: data };
            await file.writeText(JSON.stringify(newData));
        } catch (error) {
            console.error('Failed to save data:', error);
            throw new Error('Failed to save data');
        }
    }
}