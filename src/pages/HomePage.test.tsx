import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from './HomePage';
import { ADMIN_ITEMS, NORMAL_ITEMS } from '../OOP/constants/MenuItems';

// Mock the child component to isolate HomePage logic
// We use a simple implementation to verify properties passed
jest.mock('../components/MenuItem', () => {
    return ({ item }: { item: any }) => (
        <li data-testid="mock-menu-item">
            {item.title}
        </li>
    );
});

// Mock CSS
jest.mock('./HomePage.module.css', () => ({
    homeContainer: 'homeContainer',
    header: 'header',
    menuGrid: 'menuGrid'
}));

describe('HomePage Component', () => {

    it('renders the header correctly', () => {
        render(<HomePage isSignedIn={false} />);
        expect(screen.getByText('Hockey Game Tracker')).toBeInTheDocument();
    });

    it('renders Normal items when isSignedIn is false', () => {
        render(<HomePage isSignedIn={false} />);

        const items = screen.getAllByTestId('mock-menu-item');

        // Check length
        expect(items).toHaveLength(NORMAL_ITEMS.length);

        // Check content specifically for Normal items (e.g., Admin Login exists)
        expect(screen.getByText('Admin Login')).toBeInTheDocument();

        // Ensure an Admin-only item is NOT present
        const manageTeams = screen.queryByText('Manage Teams');
        expect(manageTeams).not.toBeInTheDocument();
    });

    it('renders Admin items when isSignedIn is true', () => {
        render(<HomePage isSignedIn={true} />);

        const items = screen.getAllByTestId('mock-menu-item');

        // Check length
        expect(items).toHaveLength(ADMIN_ITEMS.length);

        // Check content specifically for Admin items
        expect(screen.getByText('Manage Teams')).toBeInTheDocument();
        expect(screen.getByText('Manage Players')).toBeInTheDocument();

        // Ensure a Normal-only item (if distinct) or strictly check structure
        // In your constants, Admin items does NOT include 'Admin Login', so we check that is gone
        const adminLogin = screen.queryByText('Admin Login');
        expect(adminLogin).not.toBeInTheDocument();
    });

    it('updates items if login status changes dynamically', () => {
        const { rerender } = render(<HomePage isSignedIn={false} />);

        // Initially Normal
        expect(screen.getByText('Admin Login')).toBeInTheDocument();

        // Change prop to true
        rerender(<HomePage isSignedIn={true} />);

        // Now Admin
        expect(screen.queryByText('Admin Login')).not.toBeInTheDocument();
        expect(screen.getByText('Manage Teams')).toBeInTheDocument();
    });
});