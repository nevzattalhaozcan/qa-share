import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format text with list patterns into HTML lists
export function formatListText(text: string): string {
    if (!text) return text;
    
    const lines = text.split('\n');
    let result: string[] = [];
    let inOrderedList = false;
    let inUnorderedList = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Check for numbered lists: 1. 2. 3. etc.
        const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        // Check for letter lists: a. b. c. or i. ii. iii. etc.
        const letterMatch = trimmedLine.match(/^([a-z]|[ivxlcdm]+)\.\s+(.+)$/i);
        // Check for bullet lists: - or * or •
        const bulletMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);
        
        if (numberedMatch || letterMatch) {
            if (!inOrderedList) {
                if (inUnorderedList) {
                    result.push('</ul>');
                    inUnorderedList = false;
                }
                result.push('<ol class="list-decimal list-inside space-y-1 ml-2">');
                inOrderedList = true;
            }
            const content = numberedMatch ? numberedMatch[2] : letterMatch![2];
            result.push(`<li class="pl-2">${content}</li>`);
        } else if (bulletMatch) {
            if (!inUnorderedList) {
                if (inOrderedList) {
                    result.push('</ol>');
                    inOrderedList = false;
                }
                result.push('<ul class="list-disc list-inside space-y-1 ml-2">');
                inUnorderedList = true;
            }
            result.push(`<li class="pl-2">${bulletMatch[1]}</li>`);
        } else {
            if (inOrderedList) {
                result.push('</ol>');
                inOrderedList = false;
            }
            if (inUnorderedList) {
                result.push('</ul>');
                inUnorderedList = false;
            }
            result.push(line || '<br/>');
        }
    }
    
    // Close any open lists
    if (inOrderedList) result.push('</ol>');
    if (inUnorderedList) result.push('</ul>');
    
    return result.join('\n');
}
