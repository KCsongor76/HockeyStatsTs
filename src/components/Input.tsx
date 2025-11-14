import React from 'react';
import styles from './Input.module.css';

interface InputProps {
    label?: string;
    type?: 'text' | 'number' | 'email' | 'password' | 'color' | 'file' | 'checkbox' | 'radio';
    value?: string | number;
    checked?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    min?: number;
    max?: number;
    accept?: string;
    name?: string;
    id?: string;
    className?: string;
    error?: string;
}

const Input: React.FC<InputProps> = ({
                                         label,
                                         type = 'text',
                                         value,
                                         checked,
                                         onChange,
                                         placeholder,
                                         required = false,
                                         min,
                                         max,
                                         accept,
                                         name,
                                         id,
                                         className = '',
                                         error
                                     }) => {
    const inputId = id || name || `input-${Math.random().toString(36).substring(2, 11)}`;

    return (
        <div className={`${styles.inputContainer} ${className}`}>
            {label && (
                <label htmlFor={inputId} className={styles.label}>
                    {label}
                </label>
            )}
            <input
                id={inputId}
                name={name}
                type={type}
                value={type === 'checkbox' || type === 'radio' ? undefined : value}
                checked={type === 'checkbox' || type === 'radio' ? checked : undefined}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                min={min}
                max={max}
                accept={accept}
                className={`${styles.input} ${error ? styles.error : ''}`}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default Input;