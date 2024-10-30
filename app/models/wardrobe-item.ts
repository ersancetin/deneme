export interface WardrobeItem {
    id: string;
    type: 'shirt' | 'pants' | 'shoes' | 'accessory';
    imageUrl: string;
    color: string;
    season: 'summer' | 'winter' | 'spring' | 'fall' | 'all';
    occasion: 'casual' | 'formal' | 'sport' | 'business';
    lastWorn?: Date;
    createdAt: Date;
}

export interface Outfit {
    id: string;
    items: WardrobeItem[];
    createdAt: Date;
    occasion: string;
    rating?: number;
}