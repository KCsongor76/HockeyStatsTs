import React from 'react';
import {ActionType} from "../OOP/enums/ActionType";

interface Props {
    actionType: ActionType;
    backgroundColor: string;
    color: string;
    x: number;
    y: number;
    onClick?: () => void;
}

const Icon = ({actionType, backgroundColor, color, x, y, onClick}: Props) => {
    const getIconStyle = (): React.CSSProperties => {
        return {
            position: 'absolute' as const,
            left: `${x}%`,
            top: `${y}%`,
            width: '24px',
            height: '24px',
            transform: 'translate(-50%, -50%)',
            cursor: onClick ? 'pointer' : 'default',
            zIndex: 10,
            display: 'flex' as const,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            pointerEvents: onClick ? 'auto' : 'none'
        };
    };

    const renderIcon = () => {

        switch (actionType) {
            case ActionType.GOAL:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 2L15 8L21 9L17 14L18 21L12 18L6 21L7 14L3 9L9 8L12 2Z"
                            fill={backgroundColor}
                            stroke={color}
                            strokeWidth="2"
                        />
                        <text x="12" y="16" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold"></text>
                    </svg>
                );
            case ActionType.SHOT:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill={backgroundColor} stroke={color} strokeWidth="2"/>
                        <circle cx="12" cy="12" r="6" fill={color}/>
                        <text x="12" y="16" textAnchor="middle" fill={backgroundColor} fontSize="12"
                              fontWeight="bold"></text>
                    </svg>
                );
            case ActionType.HIT:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="4" width="16" height="16" rx="3" fill={backgroundColor} stroke={color}
                              strokeWidth="2"/>
                        <line x1="8" y1="8" x2="16" y2="16" stroke={color} strokeWidth="2"/>
                        <line x1="16" y1="8" x2="8" y2="16" stroke={color} strokeWidth="2"/>
                        <text x="12" y="16" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold"></text>
                    </svg>
                );

            case ActionType.TURNOVER:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill={backgroundColor} stroke={color} strokeWidth="2"/>
                        <path
                            d="M8 12H16M8 12L11 9M8 12L11 15"
                            stroke={color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <text x="12" y="16" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold"></text>
                    </svg>
                );

            default:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill={backgroundColor} stroke={color} strokeWidth="2"/>
                        <text x="12" y="16" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold"></text>
                    </svg>
                );
        }
    };

    return (
        <div style={getIconStyle()} onClick={onClick}>
            {renderIcon()}
        </div>
    );
};

export default Icon;