// Simple password generation utility
export function generatePassword(_length: number = 8): string {
    return '123456';
}

// Simple hash function for password storage (not cryptographically secure, just for demo)
export function hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}
