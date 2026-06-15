import React, { useEffect, useState } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { useKeyboard } from '../context/KeyboardContext';
import { X, Check } from '@phosphor-icons/react';

const VirtualKeyboard = () => {
    const { isVisible, closeKeyboard, handleInput, initialValue, keyboardType } = useKeyboard();
    const [layout, setLayout] = useState('default');
    const [input, setInput] = useState('');

    useEffect(() => {
        if (isVisible) {
            setInput(initialValue || '');
        }
    }, [isVisible, initialValue]);

    const onChange = (input) => {
        setInput(input);
        handleInput(input);
    };

    const onKeyPress = (button) => {
        if (button === "{shift}" || button === "{lock}") {
            handleShift();
        } else if (button === "{globe}") {
            handleLanguageToggle();
        } else if (button === "{enter}") {
            closeKeyboard();
        } else if (button === "{escape}") {
            closeKeyboard();
        }
    };

    const handleLanguageToggle = () => {
        if (layout.startsWith('kurdish')) {
            setLayout('default');
        } else {
            setLayout('kurdish');
        }
    };

    const handleShift = () => {
        const isKurdish = layout.startsWith('kurdish');
        const currentLayout = layout;

        let newLayout;
        if (isKurdish) {
            newLayout = currentLayout === 'kurdish' ? 'kurdishShift' : 'kurdish';
        } else {
            newLayout = currentLayout === 'default' ? 'shift' : 'default';
        }
        setLayout(newLayout);
    };

    const handleClose = (e) => {
        e.stopPropagation(); // Prevent closing when clicking the keyboard area
        closeKeyboard();
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Close on click outside */}
            <div className="fixed inset-0 z-[9998]" onClick={closeKeyboard} />

            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-[650px] bg-gray-50 dark:bg-gray-900 backdrop-blur-md shadow-2xl shadow-coffee-500/20 rounded-xl border-2 border-coffee-500 animate-slide-up overflow-hidden">
                <div className="p-2 text-gray-800 dark:text-gray-100">
                    <Keyboard
                        keyboardRef={r => (r)}
                        layoutName={layout}
                        onChange={onChange}
                        onKeyPress={onKeyPress}
                        theme={`hg-theme-default hg-layout-default myTheme ${layout.startsWith('kurdish') ? 'kurdish-keyboard' : ''}`}
                        inputName="input"
                        value={input}
                        layout={{
                            default: [
                                "{bksp} = - 0 9 8 7 6 5 4 3 2 1 `",
                                "\\ ] [ p o i u y t r e w q {tab}",
                                "{enter} ' ; l k j h g f d s a {lock}",
                                "{shift} / . , m n b v c x z {shift}",
                                "{space} {globe}"
                            ],
                            shift: [
                                "{bksp} + _ ) ( * & ^ % $ # @ ! ~",
                                "| } { P O I U Y T R E W Q {tab}",
                                "{enter} \" : L K J H G F D S A {lock}",
                                "{shift} ? > < M N B V C X Z {shift}",
                                "{space} {globe}"
                            ],
                            kurdish: [
                                "{bksp} = - ٠ ٩ ٨ ٧ ٦ ٥ ٤ ٣ ٢ ١",
                                "\\ ] [ پ ۆ ێ ئ ی ت ر ە و ق {tab}",
                                "{enter} ' ; ل ک ج ه گ ف د س ا {lock}",
                                "{shift} / . , م ن ب ڤ چ خ ز {shift}",
                                "{space} {globe}"
                            ],
                            kurdishShift: [
                                "{bksp} + _ ) ( * & ^ % $ # @ ! ~",
                                "| } { P O I U Y ط ڕ ع W Q {tab}",
                                "{enter} \" : ڵ K ژ ح غ ث ذ ش A {lock}",
                                "{shift} ? > < M N B V C X ظ {shift}",
                                "{space} {globe}"
                            ]
                        }}
                        display={{
                            "{bksp}": "⌫",
                            "{enter}": "ENTER",
                            "{shift}": "⇧",
                            "{s}": "shift",
                            "{tab}": "tab",
                            "{lock}": "caps",
                            "{space}": "space",
                            "{globe}": "🌐"
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default VirtualKeyboard;
