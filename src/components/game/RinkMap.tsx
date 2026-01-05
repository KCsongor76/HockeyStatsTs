import React from 'react';
import {IGameAction} from "../../OOP/interfaces/IGameAction";
import Icon from "../Icon";
import styles from "./Rink.module.css";

interface RinkMapProps {
    rinkImage: string;
    actions: IGameAction[];
    getIconColors: (action: IGameAction) => { backgroundColor?: string; color?: string };
    onIconClick: (action: IGameAction) => void;
}

const RinkMap: React.FC<RinkMapProps> = ({
                                             rinkImage,
                                             actions,
                                             getIconColors,
                                             onIconClick
                                         }) => {
    return (
        <div className={styles.rinkContainer}>
            <img src={rinkImage} alt="rink" className={styles.readOnlyRink}/>
            <div className={styles.iconContainer}>
                {actions.map((action, index) => {
                    const colors = getIconColors(action);
                    return (
                        <Icon
                            key={`filtered-${index}`}
                            actionType={action.type}
                            backgroundColor={colors.backgroundColor ?? '#ffffff'}
                            color={colors.color ?? '#000000'}
                            x={action.x}
                            y={action.y}
                            onClick={() => onIconClick(action)}
                        />
                    )
                })}
            </div>
        </div>
    );
};

export default RinkMap;