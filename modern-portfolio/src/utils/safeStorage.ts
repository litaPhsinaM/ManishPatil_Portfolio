// Storage access throws (not returns null) when a browser blocks site data —
// Safari with cookies disabled, some in-app webviews, hardened privacy modes.
// Several call sites read storage inside useState initializers, so an uncaught
// throw there kills the whole render. Degrade to "no persistence" instead.

export const readStorage = (
    storage: 'local' | 'session',
    key: string,
): string | null => {
    try {
        return (storage === 'local' ? window.localStorage : window.sessionStorage).getItem(key);
    } catch {
        return null;
    }
};

export const writeStorage = (
    storage: 'local' | 'session',
    key: string,
    value: string,
): void => {
    try {
        (storage === 'local' ? window.localStorage : window.sessionStorage).setItem(key, value);
    } catch {
        /* persistence unavailable — the session still works, it just won't be remembered */
    }
};
