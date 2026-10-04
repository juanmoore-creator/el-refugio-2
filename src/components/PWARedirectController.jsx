import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const PWARedirectController = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Detect if the app is running in standalone mode (PWA installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        if (isStandalone) {
            // Si entramos con la URL especial ?public=true, activamos el bypass temporal
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('public') === 'true') {
                sessionStorage.setItem('bypassAdminRedirect', 'true');
            }

            const unsubscribe = onAuthStateChanged(auth, (user) => {
                // Chequeamos si el bypass NO está activado
                const bypass = sessionStorage.getItem('bypassAdminRedirect') === 'true';

                if (user && !bypass) {
                    // If we are in PWA and the user is logged in, redirect to admin
                    // Only redirect if we are at the root path to avoid interrupting other flows
                    if (window.location.pathname === '/') {
                        navigate('/admin');
                    }
                }
            });

            return () => unsubscribe();
        }
    }, [navigate]);

    return null;
};

export default PWARedirectController;
