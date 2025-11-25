import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuItem from './MenuItem';

// 1. Safer Mock: We don't use requireActual to avoid resolution errors
const mockNavigate = jest.fn();

// The 3rd argument { virtual: true } tells Jest:
// "I don't care if this file physically exists, just mock it."
jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}), { virtual: true });

// Mock CSS module
jest.mock('./MenuItem.module.css', () => ({
    menuItem: 'menuItem',
    icon: 'icon',
    content: 'content'
}));

const mockItem = {
    title: 'Test Title',
    description: 'Test Description',
    icon: '🧪',
    path: '/test-path'
};

describe('MenuItem Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    it('renders item content correctly', () => {
        render(<MenuItem item={mockItem} />); // removed key prop here as per previous fix
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText('🧪')).toBeInTheDocument();
    });

    it('navigates to the correct path on click', () => {
        render(<MenuItem item={mockItem} />);
        const liElement = screen.getByRole('listitem'); // Assuming <li> is used
        // OR if you added the test-id: screen.getByTestId('menu-item');

        fireEvent.click(liElement);
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/test-path');
    });
});