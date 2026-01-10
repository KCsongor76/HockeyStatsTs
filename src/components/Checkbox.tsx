import React, {InputHTMLAttributes} from 'react';
import styles from './Checkbox.module.css';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
}

const Checkbox: React.FC<CheckboxProps> = ({id, label, className, ...props}) => {
    return (
        <div className={`${styles.container} ${className || ''}`}>
            <input
                type="checkbox"
                id={id}
                className={styles.input}
                {...props}
            />
            <label htmlFor={id} className={styles.label}>
                {label}
            </label>
        </div>
    );
};

export default Checkbox;