import { Observable, alert, Frame, SegmentedBarItem } from '@nativescript/core';
import { WardrobeItem, Outfit } from '../../models/wardrobe-item';
import { AIService } from '../../services/ai-service';
import { StorageService } from '../../services/storage-service';
import { FilterDialogViewModel } from '../dialogs/filter-dialog-view-model';
import { OutfitDialogViewModel } from '../dialogs/outfit-dialog-view-model';
import { showModal } from '@nativescript/core/ui/dialogs';

export class HomeViewModel extends Observable {
    private _wardrobeItems: WardrobeItem[] = [];
    private _outfits: Outfit[] = [];
    private _searchQuery: string = '';
    private _filters: any = {};
    private aiService: AIService;
    private storageService: StorageService;

    occasionFilters = this.createSegmentedItems(['All', 'Casual', 'Formal', 'Business', 'Sport']);
    selectedOccasionIndex = 0;

    constructor() {
        super();
        this.aiService = new AIService();
        this.storageService = StorageService.getInstance();
        this.loadItems();
        this.loadOutfits();
    }

    get searchQuery(): string {
        return this._searchQuery;
    }

    set searchQuery(value: string) {
        if (this._searchQuery !== value) {
            this._searchQuery = value;
            this.notifyPropertyChange('searchQuery', value);
            this.notifyPropertyChange('filteredItems', this.filteredItems);
        }
    }

    get filteredItems(): WardrobeItem[] {
        let items = this._wardrobeItems;
        
        // Apply search
        if (this._searchQuery) {
            items = items.filter(item => 
                item.type.includes(this._searchQuery.toLowerCase()) ||
                item.color.includes(this._searchQuery.toLowerCase()) ||
                item.occasion.includes(this._searchQuery.toLowerCase())
            );
        }

        // Apply filters
        if (this._filters.type) {
            items = items.filter(item => item.type === this._filters.type);
        }
        if (this._filters.season) {
            items = items.filter(item => item.season === this._filters.season);
        }
        if (this._filters.occasion) {
            items = items.filter(item => item.occasion === this._filters.occasion);
        }

        return items;
    }

    get filteredOutfits(): Outfit[] {
        if (this.selectedOccasionIndex === 0) {
            return this._outfits;
        }
        const occasion = this.occasionFilters[this.selectedOccasionIndex].title.toLowerCase();
        return this._outfits.filter(outfit => outfit.occasion === occasion);
    }

    get activeFilters(): string {
        const filters = [];
        if (this._filters.type) filters.push(this._filters.type);
        if (this._filters.season) filters.push(this._filters.season);
        if (this._filters.occasion) filters.push(this._filters.occasion);
        return filters.join(', ');
    }

    get hasActiveFilters(): boolean {
        return Object.keys(this._filters).length > 0;
    }

    onAddItem() {
        Frame.topmost().navigate({
            moduleName: 'views/add-item/add-item-page',
            clearHistory: false
        });
    }

    async showFilterDialog() {
        const context = new FilterDialogViewModel(this._filters);
        const result = await showModal({
            viewModel: context,
            fullscreen: false,
            animated: true
        });

        if (result) {
            this._filters = result;
            this.notifyPropertyChange('filteredItems', this.filteredItems);
            this.notifyPropertyChange('activeFilters', this.activeFilters);
            this.notifyPropertyChange('hasActiveFilters', this.hasActiveFilters);
        }
    }

    clearFilters() {
        this._filters = {};
        this.notifyPropertyChange('filteredItems', this.filteredItems);
        this.notifyPropertyChange('activeFilters', this.activeFilters);
        this.notifyPropertyChange('hasActiveFilters', this.hasActiveFilters);
    }

    async showOutfitDialog() {
        const context = new OutfitDialogViewModel(this._wardrobeItems);
        const result = await showModal({
            viewModel: context,
            fullscreen: false,
            animated: true
        });

        if (result) {
            const outfit = await this.aiService.generateOutfit(
                this._wardrobeItems,
                result.occasion
            );

            await this.storageService.saveOutfit(outfit);
            this._outfits.unshift(outfit);
            this.notifyPropertyChange('filteredOutfits', this.filteredOutfits);
        }
    }

    async onWearOutfit(args: any) {
        const outfit = args.object.bindingContext as Outfit;
        const today = new Date();
        
        // Update last worn date for all items in the outfit
        for (const item of outfit.items) {
            const wardrobeItem = this._wardrobeItems.find(i => i.id === item.id);
            if (wardrobeItem) {
                wardrobeItem.lastWorn = today;
            }
        }

        await this.storageService.updateItems(this._wardrobeItems);
        this.notifyPropertyChange('filteredItems', this.filteredItems);
    }

    onItemMenu(args: any) {
        const item = args.object.bindingContext as WardrobeItem;
        alert({
            title: "Item Options",
            message: "What would you like to do?",
            actions: ["Edit", "Delete", "Cancel"],
        }).then((result) => {
            if (result === "Delete") {
                this.deleteItem(item);
            } else if (result === "Edit") {
                this.editItem(item);
            }
        });
    }

    private async deleteItem(item: WardrobeItem) {
        const confirmed = await confirm({
            title: "Delete Item",
            message: "Are you sure you want to delete this item?",
            okButtonText: "Delete",
            cancelButtonText: "Cancel"
        });

        if (confirmed) {
            await this.storageService.deleteItem(item.id);
            this._wardrobeItems = this._wardrobeItems.filter(i => i.id !== item.id);
            this.notifyPropertyChange('filteredItems', this.filteredItems);
        }
    }

    private editItem(item: WardrobeItem) {
        Frame.topmost().navigate({
            moduleName: 'views/add-item/add-item-page',
            context: item
        });
    }

    private createSegmentedItems(items: string[]): SegmentedBarItem[] {
        return items.map(item => {
            const segmentedBarItem = new SegmentedBarItem();
            segmentedBarItem.title = item;
            return segmentedBarItem;
        });
    }

    private async loadItems() {
        try {
            this._wardrobeItems = await this.storageService.getItems();
            this.notifyPropertyChange('filteredItems', this.filteredItems);
        } catch (error) {
            console.error('Failed to load items:', error);
        }
    }

    private async loadOutfits() {
        try {
            this._outfits = await this.storageService.getOutfits();
            this.notifyPropertyChange('filteredOutfits', this.filteredOutfits);
        } catch (error) {
            console.error('Failed to load outfits:', error);
        }
    }
}