import { Observable, Frame, SegmentedBarItem } from '@nativescript/core';
import { ImageService } from '../../services/image-service';
import { StorageService } from '../../services/storage-service';
import { WardrobeItem } from '../../models/wardrobe-item';

export class AddItemViewModel extends Observable {
    private imageService: ImageService;
    private storageService: StorageService;
    private _previewImage: string = '';
    
    types = this.createSegmentedItems(['Shirt', 'Pants', 'Shoes', 'Accessory']);
    seasons = this.createSegmentedItems(['Summer', 'Winter', 'Spring', 'Fall', 'All']);
    occasions = this.createSegmentedItems(['Casual', 'Formal', 'Sport', 'Business']);

    selectedTypeIndex = 0;
    selectedSeasonIndex = 4; // 'All' by default
    selectedOccasionIndex = 0;
    color = '';

    constructor() {
        super();
        this.imageService = new ImageService();
        this.storageService = StorageService.getInstance();
    }

    get previewImage(): string {
        return this._previewImage || '~/assets/placeholder.png';
    }

    get canSave(): boolean {
        return this._previewImage !== '' && this.color !== '';
    }

    async onTakePhoto() {
        try {
            const imagePath = await this.imageService.captureImage();
            this._previewImage = imagePath;
            this.notifyPropertyChange('previewImage', imagePath);
            this.notifyPropertyChange('canSave', this.canSave);
        } catch (error) {
            console.error('Failed to take photo:', error);
        }
    }

    async onChoosePhoto() {
        try {
            const imagePath = await this.imageService.pickFromGallery();
            this._previewImage = imagePath;
            this.notifyPropertyChange('previewImage', imagePath);
            this.notifyPropertyChange('canSave', this.canSave);
        } catch (error) {
            console.error('Failed to choose photo:', error);
        }
    }

    async onSaveItem() {
        try {
            const newItem: WardrobeItem = {
                id: `item-${Date.now()}`,
                type: this.types[this.selectedTypeIndex].title.toLowerCase() as any,
                imageUrl: this._previewImage,
                color: this.color.toLowerCase(),
                season: this.seasons[this.selectedSeasonIndex].title.toLowerCase() as any,
                occasion: this.occasions[this.selectedOccasionIndex].title.toLowerCase() as any,
                createdAt: new Date()
            };

            await this.storageService.saveItem(newItem);
            Frame.topmost().goBack();
        } catch (error) {
            console.error('Failed to save item:', error);
            alert({
                title: "Error",
                message: "Failed to save item. Please try again.",
                okButtonText: "OK"
            });
        }
    }

    private createSegmentedItems(items: string[]): SegmentedBarItem[] {
        return items.map(item => {
            const segmentedBarItem = new SegmentedBarItem();
            segmentedBarItem.title = item;
            return segmentedBarItem;
        });
    }
}