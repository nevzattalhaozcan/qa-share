import type { KeyboardEvent } from 'react';

// Helper function to convert Arabic to Roman numerals
function toRoman(num: number): string {
    const romanMap: [number, string][] = [
        [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
        [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
        [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
    ];
    let result = '';
    for (const [value, numeral] of romanMap) {
        while (num >= value) {
            result += numeral;
            num -= value;
        }
    }
    return result;
}

// Helper function to convert Roman to Arabic numerals
function fromRoman(roman: string): number {
    const romanMap: { [key: string]: number } = {
        'i': 1, 'v': 5, 'x': 10, 'l': 50, 'c': 100, 'd': 500, 'm': 1000
    };
    let result = 0;
    const r = roman.toLowerCase();
    for (let i = 0; i < r.length; i++) {
        const current = romanMap[r[i]];
        const next = romanMap[r[i + 1]];
        if (next && current < next) {
            result -= current;
        } else {
            result += current;
        }
    }
    return result;
}

export function useListAutoFormat() {
    const handleKeyDown = (
        e: KeyboardEvent<HTMLTextAreaElement>,
        value: string,
        onChange: (value: string) => void
    ) => {
        if (e.key !== 'Enter') return;

        const textarea = e.currentTarget;
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const textAfterCursor = value.substring(cursorPos);
        
        // Find the current line
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        
        // Check for roman numeral list: i. ii. iii. iv. etc.
        const romanMatch = currentLine.match(/^(\s*)([ivxlcdm]+)\.\s(.*)$/i);
        if (romanMatch) {
            const [, indent, roman, content] = romanMatch;
            
            // Validate it's actually a roman numeral (not just random letters)
            const romanValue = fromRoman(roman);
            if (romanValue > 0 && romanValue < 4000) {
                // If line has no content after the roman numeral, remove the list marker
                if (!content.trim()) {
                    e.preventDefault();
                    const newValue = textBeforeCursor.substring(0, textBeforeCursor.lastIndexOf('\n') + 1) + 
                                    indent + textAfterCursor;
                    onChange(newValue);
                    
                    setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = textBeforeCursor.lastIndexOf('\n') + 1 + indent.length;
                    }, 0);
                    return;
                }
                
                // Continue roman numeral list
                e.preventDefault();
                const nextRoman = toRoman(romanValue + 1);
                const newValue = textBeforeCursor + '\n' + indent + nextRoman + '. ' + textAfterCursor;
                onChange(newValue);
                
                setTimeout(() => {
                    const newPos = cursorPos + indent.length + nextRoman.length + 3; // +3 for '\n', '.', ' '
                    textarea.selectionStart = textarea.selectionEnd = newPos;
                }, 0);
                return;
            }
        }
        
        // Check for numbered list: 1. 2. 3. etc.
        const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)$/);
        if (numberedMatch) {
            const [, indent, num, content] = numberedMatch;
            
            // If line has no content after the number, remove the list marker
            if (!content.trim()) {
                e.preventDefault();
                const newValue = textBeforeCursor.substring(0, textBeforeCursor.lastIndexOf('\n') + 1) + 
                                indent + textAfterCursor;
                onChange(newValue);
                
                // Set cursor position
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = textBeforeCursor.lastIndexOf('\n') + 1 + indent.length;
                }, 0);
                return;
            }
            
            // Continue numbered list
            e.preventDefault();
            const nextNum = parseInt(num) + 1;
            const newValue = textBeforeCursor + '\n' + indent + nextNum + '. ' + textAfterCursor;
            onChange(newValue);
            
            // Set cursor position after the new number
            setTimeout(() => {
                const newPos = cursorPos + indent.length + nextNum.toString().length + 3; // +3 for '\n', '.', ' '
                textarea.selectionStart = textarea.selectionEnd = newPos;
            }, 0);
            return;
        }
        
        // Check for letter list: a. b. c. etc. (but not roman numerals)
        const letterMatch = currentLine.match(/^(\s*)([a-z])\.\s(.*)$/i);
        if (letterMatch) {
            const [, indent, letter, content] = letterMatch;
            
            // Skip if it's a roman numeral
            const romanValue = fromRoman(letter);
            if (romanValue > 0 && romanValue < 4000) {
                return; // Let roman numeral handler take care of this
            }
            
            // If line has no content after the letter, remove the list marker
            if (!content.trim()) {
                e.preventDefault();
                const newValue = textBeforeCursor.substring(0, textBeforeCursor.lastIndexOf('\n') + 1) + 
                                indent + textAfterCursor;
                onChange(newValue);
                
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = textBeforeCursor.lastIndexOf('\n') + 1 + indent.length;
                }, 0);
                return;
            }
            
            // Continue letter list
            e.preventDefault();
            const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
            // Stop at 'z' or 'Z'
            if ((letter === 'z' || letter === 'Z') && content.trim()) {
                const newValue = textBeforeCursor + '\n' + indent + textAfterCursor;
                onChange(newValue);
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = cursorPos + 1 + indent.length;
                }, 0);
            } else {
                const newValue = textBeforeCursor + '\n' + indent + nextLetter + '. ' + textAfterCursor;
                onChange(newValue);
                setTimeout(() => {
                    const newPos = cursorPos + indent.length + 4; // +4 for '\n', letter, '.', ' '
                    textarea.selectionStart = textarea.selectionEnd = newPos;
                }, 0);
            }
            return;
        }
        
        // Check for bullet list: - or * or •
        const bulletMatch = currentLine.match(/^(\s*)([-*•])\s(.*)$/);
        if (bulletMatch) {
            const [, indent, bullet, content] = bulletMatch;
            
            // If line has no content after the bullet, remove the list marker
            if (!content.trim()) {
                e.preventDefault();
                const newValue = textBeforeCursor.substring(0, textBeforeCursor.lastIndexOf('\n') + 1) + 
                                indent + textAfterCursor;
                onChange(newValue);
                
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = textBeforeCursor.lastIndexOf('\n') + 1 + indent.length;
                }, 0);
                return;
            }
            
            // Continue bullet list
            e.preventDefault();
            const newValue = textBeforeCursor + '\n' + indent + bullet + ' ' + textAfterCursor;
            onChange(newValue);
            
            setTimeout(() => {
                const newPos = cursorPos + indent.length + 3; // +3 for '\n', bullet, ' '
                textarea.selectionStart = textarea.selectionEnd = newPos;
            }, 0);
            return;
        }
    };

    return { handleKeyDown };
}
