import * as NavigationNames from './NavigationNames';

describe('NavigationNames Constants', () => {

    it('should not have duplicate route paths', () => {
        // Get all the path strings defined in the file
        const routes = Object.values(NavigationNames);

        // Create a Set (which removes duplicates)
        const uniqueRoutes = new Set(routes);

        // If the size matches, it means there were no duplicates
        expect(uniqueRoutes.size).toBe(routes.length);
    });

    it('should define critical routes', () => {
        // Sanity check to ensure critical paths aren't accidentally deleted
        expect(NavigationNames.START).toBe('start');
        expect(NavigationNames.ADMIN).toBe('admin');
        expect(NavigationNames.SAVED_GAMES).toBe('saved_games');
    });
});