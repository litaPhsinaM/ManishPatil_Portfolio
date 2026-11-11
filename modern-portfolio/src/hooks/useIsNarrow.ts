import { useEffect, useState } from 'react';

/** True on phone-sized screens, where long sections collapse behind "show more" buttons. */
export function useIsNarrow(query = '(max-width: 640px)'): boolean {
    const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
    useEffect(() => {
        const mq = window.matchMedia(query);
        const update = () => setNarrow(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, [query]);
    return narrow;
}
