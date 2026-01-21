import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const PWARedirectController = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if the app is running in standalone mode (PWA)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        if (isStandalone) {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    // If we are in PWA and the user is logged in, redirect to admin
                    // Only redirect if we are at the root path to avoid interrupting other flows
                    if (window.location.pathname === '/') {
                        navigate('/admin', { replace: true });
                    }
                }
            });

            return () => unsubscribe();
        }
    }, [navigate]);

    return null; // This component doesn't render anything
};

export default PWARedirectController;
