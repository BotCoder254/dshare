import React from 'react';

const Input = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  className = '',
  disabled = false,
  required = false,
  helperText,
  icon,
  ...rest
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 rounded-md 
            bg-white dark:bg-dark-bg-secondary
            border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
            text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-mpesa-green focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed disabled:dark:bg-dark-bg-primary
            transition-colors duration-200
            ${icon ? 'pl-10' : ''}
          `}
          {...rest}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
