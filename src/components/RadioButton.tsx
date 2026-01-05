import React, {InputHTMLAttributes, ReactNode} from 'react';

interface RadioButtonProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: ReactNode; // ReactNode allows passing text or images (like the Rink image)
}

const RadioButton: React.FC<RadioButtonProps> = ({id, label, className, ...props}) => {
    return (
        <div className={`radio-group ${className || ''}`}>
            <input
                type="radio"
                id={id}
                {...props}
            />
            <label htmlFor={id}>
                {label}
            </label>
        </div>
    );
};

export default RadioButton;