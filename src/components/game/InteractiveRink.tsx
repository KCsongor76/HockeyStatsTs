import React from 'react';
import {IGameAction} from "../../OOP/interfaces/IGameAction";
import Icon from "../Icon";
import styles from "./Rink.module.css";

interface InteractiveRinkProps {
    rinkImage: string;
    actions: IGameAction[];
    onRinkClick: (e: React.MouseEvent<HTMLImageElement>) => void;
    getIconColors: (action: IGameAction) => { backgroundColor?: string; color?: string };
    onIconClick: (action: IGameAction) => void;
    showDetails: boolean;
}

const InteractiveRink: React.FC<InteractiveRinkProps> = ({
                                                             rinkImage,
                                                             actions,
                                                             onRinkClick,
                                                             getIconColors,
                                                             onIconClick,
                                                             showDetails
                                                         }) => {
    return (
        <div className={styles.gameContainer}>
            <div className={styles.rinkContainer}>
                <img
                    src={rinkImage}
                    alt="rink"
                    onClick={onRinkClick}
                    className={styles.clickableRink}
                />
                {showDetails && <div className={styles.iconContainer}>
                    {actions.map((action, index) => {
                        const colors = getIconColors(action);
                        return (
                            <Icon
                                key={index}
                                actionType={action.type}
                                backgroundColor={colors.backgroundColor ?? '#ffffff'}
                                color={colors.color ?? '#000000'}
                                x={action.x}
                                y={action.y}
                                onClick={() => onIconClick(action)}
                            />
                        )
                    })}
                </div>}
            </div>
        </div>
    );
};

export default InteractiveRink;