import React, { createContext, useContext, useState, useRef } from 'react';

const KeyboardContext = createContext();

export const KeyboardProvider = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isEnabled, setIsEnabled] = useState(localStorage.getItem('keyboard_enabled') !== 'false'); // Default true
    const [keyboardType, setKeyboardType] = useState('default'); // default, numpad
    const [initialValue, setInitialValue] = useState('');
    const inputRef = useRef(null); // The actual DOM input element
    const onChangeRef = useRef(null); // The React onChange handler

    const toggleKeyboardEnabled = () => {
        const newState = !isEnabled;
        setIsEnabled(newState);
        localStorage.setItem('keyboard_enabled', newState);
    };

    const openKeyboard = (inputElement, type = 'default', currentValue = '', onChangeHandler = null) => {
        if (!isEnabled) return; // Respect global setting

        inputRef.current = inputElement;
        onChangeRef.current = onChangeHandler;
        setInitialValue(currentValue);
        setKeyboardType(type);
        setIsVisible(true);
    };

    const closeKeyboard = () => {
        setIsVisible(false);
        inputRef.current = null;
        onChangeRef.current = null;
    };

    const handleInput = (input) => {
        if (inputRef.current) {
            // Update the DOM value directly for immediate feedback
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            nativeInputValueSetter.call(inputRef.current, input);

            const event = new Event('input', { bubbles: true });
            inputRef.current.dispatchEvent(event);

            // Also call the React handler if provided
            if (onChangeRef.current) {
                // Creating a synthetic-like event structure
                onChangeRef.current({ target: { value: input } });
            }
        }
    };

    return (
        <KeyboardContext.Provider value={{ isVisible, isEnabled, toggleKeyboardEnabled, keyboardType, initialValue, openKeyboard, closeKeyboard, handleInput }}>
            {children}
        </KeyboardContext.Provider>
    );
};

export const useKeyboard = () => useContext(KeyboardContext);
