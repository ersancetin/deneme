import OpenAI from 'openai';
import { WardrobeItem, Outfit } from '../models/wardrobe-item';

export class AIService {
    private openai: OpenAI;
    
    constructor() {
        this.openai = new OpenAI({
            apiKey: 'YOUR_API_KEY', // TODO: Move to secure storage
            dangerouslyAllowBrowser: true
        });
    }

    async generateOutfit(items: WardrobeItem[], occasion: string): Promise<Outfit> {
        const itemDescriptions = items.map(item => 
            `${item.type} (${item.color}, suitable for ${item.occasion}, ${item.season} season)`
        ).join('\n');

        const prompt = `Given these clothing items:\n${itemDescriptions}\n\nCreate a stylish outfit for ${occasion} occasion. Consider color coordination, occasion appropriateness, and seasonal compatibility.`;

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: "You are a professional fashion stylist. Create outfits that are stylish and appropriate for the occasion."
                    },
                    { 
                        role: "user", 
                        content: prompt 
                    }
                ],
                model: "gpt-3.5-turbo",
            });

            const suggestion = completion.choices[0].message.content;
            
            // Parse AI suggestion and select items
            const selectedItems = this.parseAISuggestion(suggestion, items);

            return {
                id: `outfit-${Date.now()}`,
                items: selectedItems,
                occasion: occasion,
                createdAt: new Date(),
                rating: 0
            };
        } catch (error) {
            console.error('AI Service Error:', error);
            throw new Error('Failed to generate outfit');
        }
    }

    private parseAISuggestion(suggestion: string, availableItems: WardrobeItem[]): WardrobeItem[] {
        // Basic implementation - can be enhanced with more sophisticated parsing
        const selectedItems: WardrobeItem[] = [];
        const types = ['shirt', 'pants', 'shoes'];
        
        types.forEach(type => {
            const item = availableItems.find(item => item.type === type);
            if (item) {
                selectedItems.push(item);
            }
        });

        return selectedItems;
    }
}