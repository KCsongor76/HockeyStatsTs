import React, {InputHTMLAttributes} from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
}

const Checkbox: React.FC<CheckboxProps> = ({id, label, className, ...props}) => {
    return (
        <div className={`checkbox-group ${className || ''}`}>
            <input
                type="checkbox"
                id={id}
                {...props}
            />
            <label htmlFor={id}>
                {label}
            </label>
        </div>
    );
};

export default Checkbox;