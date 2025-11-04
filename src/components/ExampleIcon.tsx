import React from 'react';
import {ActionType} from "../OOP/enums/ActionType";

interface Props {
    actionType: ActionType;
    backgroundColor: string;
    color: string;
    onClick?: () => void;
}

const ExampleIcon = ({actionType, backgroundColor, color, onClick}: Props) => {
    const getIconStyle = (): React.CSSProperties => {
        return {
            width: '24px',
            height: '24px',
            cursor: onClick ? 'pointer' : 'default',
            display: 'inline-block',
            verticalAlign: 'middle',
            margin: '0 8px'
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
                    </svg>
                );
            case ActionType.SHOT:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill={backgroundColor} stroke={color} strokeWidth="2"/>
                        <circle cx="12" cy="12" r="6" fill={color}/>
                    </svg>
                );
            case ActionType.HIT:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="4" width="16" height="16" rx="3" fill={backgroundColor} stroke={color}
                              strokeWidth="2"/>
                        <line x1="8" y1="8" x2="16" y2="16" stroke={color} strokeWidth="2"/>
                        <line x1="16" y1="8" x2="8" y2="16" stroke={color} strokeWidth="2"/>
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
                    </svg>
                );
            default:
                return (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill={backgroundColor} stroke={color} strokeWidth="2"/>
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

export default ExampleIcon;