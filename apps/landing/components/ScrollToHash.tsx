import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToHash = () => {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (hash) {
            const id = hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                // Delay slightly to ensure content is rendered
                const timeout = setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
                return () => clearTimeout(timeout);
            }
        } else {
            // Scroll to top on route change if no hash
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }
    }, [pathname, hash]);

    return null;
};

export default ScrollToHash;
