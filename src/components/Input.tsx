import React, {InputHTMLAttributes} from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    error?: string;
    hideLabel?: boolean;
}

const Input: React.FC<InputProps> = ({id, label, error, hideLabel, className, ...props}) => {
    return (
        <div className={`${styles.container} ${className || ''}`}>
            <label
                htmlFor={id}
                className={hideLabel ? styles.hiddenLabel : styles.label}
            >
                {label}
            </label>
            <input
                id={id}
                className={styles.input}
                {...props}
            />
            {error && <span className={styles.error}>{error}</span>}
        </div>
    );
};

export default Input;