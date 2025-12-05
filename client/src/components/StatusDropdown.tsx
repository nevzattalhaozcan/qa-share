import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusDropdownProps {
    currentStatus: string;
    options: string[];
    onUpdate: (status: string) => void;
    colorMap?: Record<string, string>;
    disabled?: boolean;
    align?: 'left' | 'right';
}

export default function StatusDropdown({ currentStatus, options, onUpdate, colorMap, disabled = false, align = 'left' }: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: align === 'right' ? rect.right + window.scrollX - 110 : rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen, align]);

    const getColorClass = (status: string) => {
        if (colorMap && colorMap[status]) return colorMap[status];
        return 'bg-slate-500/10 text-slate-500';
    };

    return (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${getColorClass(currentStatus)} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                disabled={disabled}
            >
                {currentStatus}
                {!disabled && <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
            </button>

            {isOpen && createPortal(
                <AnimatePresence>
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        style={{
                            position: 'absolute',
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            zIndex: 9999,
                            width: '110px'
                        }}
                        className="bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="py-1">
                            {options.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        onUpdate(option);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-all ${
                                        option === currentStatus 
                                            ? 'bg-primary/20 text-primary font-semibold' 
                                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option}</span>
                                        {option === currentStatus && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
