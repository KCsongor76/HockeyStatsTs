import {
    START_ITEM,
    ADMIN_ITEMS,
    NORMAL_ITEMS
} from './MenuItems';
import {
    START,
    SAVED_GAMES,
    HANDLE_TEAMS,
    HANDLE_PLAYERS,
    ADMIN
} from './NavigationNames';
// Ensure this import path points to your actual NavigationNames.ts file

describe('MenuItems Configuration', () => {

    // 1. Test the Single Constant Export
    it('defines START_ITEM correctly', () => {
        expect(START_ITEM).toEqual({
            title: 'Start New Game',
            description: 'Begin a new hockey game tracking session',
            icon: '🏒',
            path: `/${START}` // Checks for "/start"
        });
    });

    // 2. Test the Admin List (Structure + Data Integrity)
    it('constructs ADMIN_ITEMS with correct paths and order', () => {
        // Admin list should be: [Start, Previous(Saved), Teams, Players]
        expect(ADMIN_ITEMS).toHaveLength(4);

        const paths = ADMIN_ITEMS.map(item => item.path);

        expect(paths).toEqual([
            `/${START}`,
            `/${SAVED_GAMES}`,
            `/${HANDLE_TEAMS}`,
            `/${HANDLE_PLAYERS}`
        ]);

        // Specific check to ensure descriptions match expected business logic
        expect(ADMIN_ITEMS[2].title).toBe('Manage Teams');
        expect(ADMIN_ITEMS[3].title).toBe('Manage Players');
    });

    // 3. Test the Normal List (Structure + Security)
    it('constructs NORMAL_ITEMS with correct paths', () => {
        // Normal list should be: [Start, Previous(Saved), Admin Login]
        expect(NORMAL_ITEMS).toHaveLength(3);

        const paths = NORMAL_ITEMS.map(item => item.path);

        expect(paths).toEqual([
            `/${START}`,
            `/${SAVED_GAMES}`,
            `/${ADMIN}`
        ]);

        // Security Check: Ensure sensitive routes are NOT present
        expect(paths).not.toContain(`/${HANDLE_TEAMS}`);
        expect(paths).not.toContain(`/${HANDLE_PLAYERS}`);
    });
});