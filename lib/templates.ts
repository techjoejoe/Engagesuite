// Game Template Management
import { Question } from '@/types';

export interface GameTemplate {
    id: string;
    title: string;
    questions: Question[];
    createdAt: number;
    lastUsed?: number;
}

// Save a game template to localStorage
export function saveGameTemplate(title: string, questions: Question[]): string {
    const templates = getGameTemplates();

    const template: GameTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title,
        questions,
        createdAt: Date.now(),
    };

    templates.push(template);
    localStorage.setItem('gameTemplates', JSON.stringify(templates));

    return template.id;
}

// Get all saved templates
export function getGameTemplates(): GameTemplate[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem('gameTemplates');
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Get a single template by ID
export function getGameTemplate(id: string): GameTemplate | null {
    const templates = getGameTemplates();
    return templates.find(t => t.id === id) || null;
}

// Delete a template
export function deleteGameTemplate(id: string): void {
    const templates = getGameTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem('gameTemplates', JSON.stringify(filtered));
}

// Update last used timestamp
export function markTemplateAsUsed(id: string): void {
    const templates = getGameTemplates();
    const template = templates.find(t => t.id === id);

    if (template) {
        template.lastUsed = Date.now();
        localStorage.setItem('gameTemplates', JSON.stringify(templates));
    }
}
