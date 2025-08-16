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
    const getShapeStyle = (): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            position: 'absolute' as const,
            left: `${x}%`,
            top: `${y}%`,
            width: '20px',
            height: '20px',
            backgroundColor,
            border: `2px solid ${color}`,
            transform: 'translate(-50%, -50%)',
            cursor: onClick ? 'pointer' : 'default',
            zIndex: 10,
            display: 'flex' as const,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            fontSize: '10px',
            fontWeight: 'bold' as const,
            color,
            pointerEvents: onClick ? 'auto' : 'none' // Allow click if needed
        };

        switch (actionType) {
            case ActionType.GOAL:
                return {
                    ...baseStyle,
                    clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)'
                };
            case ActionType.SHOT:
                return {
                    ...baseStyle,
                    borderRadius: '50%'
                };
            case ActionType.HIT:
                return {
                    ...baseStyle,
                    borderRadius: '0'
                };
            case ActionType.TURNOVER:
                return {
                    ...baseStyle,
                    clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)'
                };
            default:
                return baseStyle;
        }
    };

    const getSymbol = () => {
        switch (actionType) {
            case ActionType.GOAL:
                return 'G';
            case ActionType.SHOT:
                return 'S';
            case ActionType.HIT:
                return 'H';
            case ActionType.TURNOVER:
                return 'T';
            default:
                return '?';
        }
    };

    return (
        <div style={getShapeStyle()} onClick={onClick}>
            {getSymbol()}
        </div>
    );
};

export default Icon;