const STORAGE_KEY = 'spo_session_token';

export function getSessionToken(): string | null {
    try {
        return sessionStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

export function setSessionToken(token: string | null | undefined): void {
    try {
        if (token) sessionStorage.setItem(STORAGE_KEY, token);
        else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        /* private mode / blocked storage */
    }
}

export function clearSessionToken(): void {
    setSessionToken(null);
}
