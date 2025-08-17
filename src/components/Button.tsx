import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
    children: React.ReactNode;
    styleType: 'positive' | 'neutral' | 'negative';
    type?: 'button' | 'submit' | 'reset';
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    className?: string;
}

const Button: React.FC<ButtonProps> = ({
                                           children,
                                           styleType,
                                           type = 'button',
                                           onClick,
                                           disabled = false,
                                           className = ''
                                       }) => {
    const buttonClasses = `${styles.button} ${styles[styleType]} ${className}`.trim();

    return (
        <button
            type={type}
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;