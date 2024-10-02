import React, { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ id, onCheckedChange, className = '', ...props }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(event.target.checked);
    }
  };

  return (
    <input
      type="checkbox"
      id={id}
      className={`form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out ${className}`}
      onChange={handleChange}
      {...props}
    />
  );
};