import {ADMIN, HANDLE_PLAYERS, HANDLE_TEAMS, SAVED_GAMES, START} from "./NavigationNames";

export const START_ITEM = {
    title: 'Start New Game',
    description: 'Begin a new hockey game tracking session',
    icon: '🏒',
    path: `/${START}`
}

const PREVIOUS_ITEM = {
    title: 'Previous Games',
    description: 'Review and analyze past game records',
    icon: '📊',
    path: `/${SAVED_GAMES}`
}

const HANDLE_TEAMS_ITEM = {
    title: 'Manage Teams',
    description: 'Create, edit, and manage hockey teams',
    icon: '🏆',
    path: `/${HANDLE_TEAMS}`
}

const HANDLE_PLAYERS_ITEM = {
    title: 'Manage Players',
    description: 'Add, transfer, and track player information',
    icon: '👥',
    path: `/${HANDLE_PLAYERS}`
}

const ADMIN_ITEM = {
    title: 'Admin Login',
    description: 'Access admin features',
    icon: '🔑',
    path: `/${ADMIN}`
}

export const ADMIN_ITEMS = [
    START_ITEM, PREVIOUS_ITEM, HANDLE_TEAMS_ITEM, HANDLE_PLAYERS_ITEM
]

export const NORMAL_ITEMS = [
    START_ITEM, PREVIOUS_ITEM, ADMIN_ITEM
]

