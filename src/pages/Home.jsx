import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import BookingCalendar from '../components/BookingCalendar';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Home = () => {
    const { id } = useParams();
    const [darkMode, setDarkMode] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [price, setPrice] = useState('75.000');

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    const scrollContainerRef = useRef(null);

    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    const openGallery = (index) => {
        setSelectedImageIndex(index);
        setIsGalleryOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeGallery = () => {
        setIsGalleryOpen(false);
        document.body.style.overflow = 'auto';
    };

    const nextGalleryImage = () => {
        setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const prevGalleryImage = () => {
        setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    useEffect(() => {
        const fetchPrice = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "properties", id, "settings", "pricing");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setPrice(docSnap.data().dailyPrice);
                } else {
                    setPrice('75.000'); // Default fallback
                }
            } catch (error) {
                console.error("Error fetching price:", error);
            }
        };
        fetchPrice();
    }, [id]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isGalleryOpen) return;
            if (e.key === 'Escape') closeGallery();
            if (e.key === 'ArrowRight') nextGalleryImage();
            if (e.key === 'ArrowLeft') prevGalleryImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGalleryOpen]);

    const scroll = (offset) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        }
    };

    const galleryImages = [
        { id: 1, src: "/images/1.jpeg", caption: "Parrilla", location: "Patio delantero" },
        { id: 2, src: "/images/2.jpeg", caption: "Televisión SMART", location: "Cocina-comedor" },
        { id: 3, src: "/images/3.jpeg", caption: "Vista al bosque", location: "Cocina-comedor" },
        { id: 4, src: "/images/4.jpeg", caption: "Heladera con freezer, microondas, pava electrica...", location: "Cocina-comedor" },
        { id: 5, src: "/images/5.jpeg", caption: "Cama matrimonial", location: "Habitación" },
        { id: 6, src: "/images/6.jpeg", caption: "Excelente ducha", location: "Baño" },
        { id: 7, src: "/images/7.jpeg", caption: "A 1 cuadra de la playa", location: "Patio delantero" },
    ];

    return (
        <div className={`bg-snow dark:bg-hunter-green text-hunter-green dark:text-snow font-sans transition-colors duration-300 overflow-x-hidden ${darkMode ? 'dark' : ''}`}>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-snow/90 dark:bg-hunter-green/90 backdrop-blur-md border-b border-muted-olive/20 dark:border-snow/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="text-2xl font-bold tracking-tight text-hunter-green dark:text-snow font-sans">El Refugio</div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide uppercase text-blue-slate dark:text-snow/90">
                        <a href="#galeria" className="hover:text-olive-bark dark:hover:text-muted-olive transition-colors">Galería</a>
                        <a href="#reservas" className="hover:text-olive-bark dark:hover:text-muted-olive transition-colors">Reserva</a>
                        <a href="#ubicacion" className="hover:text-olive-bark dark:hover:text-muted-olive transition-colors">Ubicación</a>
                        <a href="#reservas" className="px-5 py-2.5 bg-hunter-green text-white rounded-full hover:bg-olive-bark transition-all font-semibold shadow-md hover:shadow-lg">Reservar Ahora</a>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href="https://wa.me/5492216430365"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full hover:bg-muted-olive/20 dark:hover:bg-snow/20 text-hunter-green dark:text-snow transition-colors flex items-center justify-center"
                            title="Contactar por WhatsApp"
                        >
                            <span className="material-icons-outlined">phone</span>
                        </a>

                        {/* Hamburger Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-full hover:bg-muted-olive/20 dark:hover:bg-snow/20 text-hunter-green dark:text-snow transition-colors"
                        >
                            <span className="material-icons-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`md:hidden absolute top-20 left-0 w-full bg-snow dark:bg-hunter-green border-b border-muted-olive/20 dark:border-snow/10 transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-96' : 'max-h-0'}`}>
                    <div className="px-6 py-8 flex flex-col space-y-6 text-lg font-medium tracking-wide uppercase text-blue-slate dark:text-snow/90 text-center">
                        <a href="#galeria" onClick={() => setMobileMenuOpen(false)} className="hover:text-olive-bark dark:hover:text-muted-olive transition-colors">Galería</a>
                        <a href="#reservas" onClick={() => setMobileMenuOpen(false)} className="hover:text-olive-bark dark:hover:text-muted-olive transition-colors">Reserva</a>
                        <a href="#ubicacion" onClick={() => setMobileMenuOpen(false)} className="hover:text-olive-bark dark:hover:text-muted-olive transition-colors">Ubicación</a>
                        <a href="#reservas" onClick={() => setMobileMenuOpen(false)} className="mx-auto px-8 py-3 bg-hunter-green text-white rounded-xl font-semibold shadow-md w-full max-w-xs">Reservar Ahora</a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col lg:flex-row pt-20 overflow-hidden">
                <div className="lg:w-7/12 relative h-[60vh] lg:h-auto overflow-hidden group">
                    <video
                        src="/videos/video.mp4"
                        poster="/images/11.jpeg"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 hero-gradient"></div>
                    <div className="absolute bottom-12 left-6 right-6 md:left-12 md:right-12 text-white text-center md:text-left">
                        <p className="text-xs uppercase tracking-[0.3em] font-medium mb-2 opacity-90">Aguas Verdes</p>
                        <h2 className="text-3xl md:text-5xl max-w-lg leading-tight font-bold drop-shadow-lg mx-auto md:mx-0">Donde el cielo abraza al mar en calma.</h2>
                    </div>
                </div>
                <div className="lg:w-5/12 flex items-center justify-center p-8 lg:p-20 bg-snow dark:bg-hunter-green text-center lg:text-left">
                    <div className="max-w-md w-full">
                        <span className="inline-block px-3 py-1 bg-gold-sand/40 text-hunter-green dark:text-snow text-xs font-bold uppercase tracking-widest rounded-full mb-6 text-center">Alquiler</span>
                        <h1 className="text-5xl lg:text-7xl mb-6 text-hunter-green dark:text-snow leading-none font-bold">
                            Bienvenido a <br /><span className="text-olive-bark dark:text-muted-olive italic font-serif">El Refugio</span>
                        </h1>
                        <p className="text-lg text-blue-slate dark:text-snow/80 mb-10 leading-relaxed font-light">
                            Un lugar diseñado para el descanso. Despertá con el sonido de las olas y disfrutá de una estadía única frente al bosque de Aguas Verdes.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="#reservas" className="px-8 py-4 bg-hunter-green text-white text-center rounded-xl font-semibold shadow-lg shadow-hunter-green/30 hover:scale-[1.02] hover:bg-olive-bark transition-all">
                                Ver Disponibilidad
                            </a>
                            <a href="#galeria" className="px-8 py-4 border-2 border-muted-olive/50 dark:border-snow/30 text-center rounded-xl font-semibold text-hunter-green dark:text-snow hover:bg-muted-olive/10 dark:hover:bg-snow/10 transition-colors">
                                Explorar Galería
                            </a>
                        </div>
                        <div className="mt-12 flex items-center gap-4 text-blue-slate dark:text-snow/60 text-sm font-medium">
                            <span>Contactanos para más información</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section id="galeria" className="py-24 bg-snow dark:bg-olive-bark relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-muted-olive/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end relative z-10">
                    <div>
                        <h2 className="text-4xl mb-4 text-hunter-green dark:text-snow font-bold">Momentos en El Refugio</h2>
                        <p className="text-blue-slate dark:text-snow/70">Desliza para ver cada rincón de nuestra propiedad.</p>
                    </div>
                    <div className="hidden md:flex gap-2">
                        <button onClick={() => scroll(-300)} className="p-3 border border-muted-olive/50 dark:border-snow/20 rounded-full hover:bg-white dark:hover:bg-hunter-green text-hunter-green dark:text-snow transition-all shadow-sm">
                            <span className="material-icons-outlined">west</span>
                        </button>
                        <button onClick={() => scroll(300)} className="p-3 border border-muted-olive/50 dark:border-snow/20 rounded-full hover:bg-white dark:hover:bg-hunter-green text-hunter-green dark:text-snow transition-all shadow-sm">
                            <span className="material-icons-outlined">east</span>
                        </button>
                    </div>
                </div>

                {/* Horizontal Scroll Gallery */}
                {/* Horizontal Scroll Gallery */}
                <div
                    ref={scrollContainerRef}
                    className="scroll-container hide-scrollbar flex overflow-x-auto gap-6 px-6 pb-12 snap-x snap-mandatory scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {galleryImages.map((img, index) => (
                        <div
                            key={img.id}
                            className="scroll-item flex-none w-[90vw] sm:w-[350px] group relative cursor-pointer"
                            onClick={() => openGallery(index)}
                        >
                            {/* Premium Card Design */}
                            <div className="relative aspect-[3/4] overflow-hidden rounded-sm shadow-md transition-all duration-500 group-hover:shadow-2xl">
                                <img
                                    src={img.src}
                                    alt={img.caption}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute bottom-0 left-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 text-white opacity-0 md:group-hover:opacity-100">
                                    <p className="text-xs font-bold tracking-widest uppercase mb-1">{img.location}</p>
                                    <h3 className="font-serif text-2xl italic">{img.caption}</h3>
                                </div>
                            </div>
                            {/* Mobile caption visible below card for better UX on touch */}
                            <div className="mt-4 md:hidden text-center">
                                <h3 className="font-serif text-xl italic text-hunter-green dark:text-snow">{img.caption}</h3>
                                <p className="text-xs text-olive-bark dark:text-gray-400 uppercase tracking-widest mt-1">{img.location}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Scroll Progress Indicator (Optional visual cue) */}
                <div className="flex justify-center mt-4 gap-2">
                    {galleryImages.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-olive-bark/30 dark:bg-gold-sand/50"></div>
                    ))}
                </div>
            </section>

            {/* Booking Section */}
            <section id="reservas" className="py-24 bg-muted-olive/10 dark:bg-hunter-green border-t border-muted-olive/10 dark:border-snow/5">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl mb-6 text-hunter-green dark:text-snow leading-tight font-bold">Reserva tu Estadía</h2>
                            <p className="text-blue-slate dark:text-snow/80 mb-8 text-lg">
                                Selecciona las fechas de tu preferencia en el calendario para consultar disponibilidad y en breve nos ponemos en contacto con vos
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-hunter-green dark:text-snow/90 font-medium">
                                    <span className="material-icons-outlined text-olive-bark dark:text-gold-sand">check_circle</span>
                                    Respuesta rápida.
                                </li>
                                <li className="flex items-center gap-3 text-hunter-green dark:text-snow/90 font-medium">
                                    <span className="material-icons-outlined text-olive-bark dark:text-gold-sand">check_circle</span>
                                    Atención personalizada.
                                </li>
                                <li className="flex items-center gap-3 text-hunter-green dark:text-snow/90 font-medium group">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gold-sand/20 text-olive-bark dark:text-gold-sand group-hover:scale-110 transition-transform">
                                        <span className="material-icons-outlined">calendar_today</span>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest opacity-60">Temporada 2026</p>
                                        <p className="text-xl font-bold font-serif italic">${price} <span className="text-sm font-sans not-italic font-normal opacity-70">/ noche</span></p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Booking Component Replacement */}
                        <div className="relative z-10 transform hover:translate-y-[-5px] transition-transform duration-500">
                            <BookingCalendar propertyId={id} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Location Section */}
            <section id="ubicacion" className="py-24 bg-snow dark:bg-olive-bark">
                <div className="max-w-7xl mx-auto px-6 text-center mb-16">
                    <h2 className="text-4xl mb-4 text-hunter-green dark:text-snow font-bold">Nuestra Ubicación</h2>
                    <p className="text-blue-slate dark:text-snow/70 max-w-2xl mx-auto">
                        Encuéntranos frente al bosque, en el corazón de la calma. Un entorno natural privilegiado diseñado para desconectar.
                    </p>
                </div>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 md:border-8 border-white dark:border-hunter-green aspect-square md:aspect-video lg:aspect-[21/9]">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d800.3607840793934!2d-56.68493715033188!3d-36.63978867173563!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x959c6dabe016df5f%3A0x1d6059926c04eae9!2sEl%20Chalet%20De%20La%20Argentina!5e0!3m2!1ses!2sar!4v1769036250069!5m2!1ses!2sar"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Ubicación de El Refugio"
                            className="absolute inset-0 w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
                        ></iframe>

                        {/* Overlay Badge */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <a
                                href="https://www.google.com/maps/place/El+Chalet+De+La+Argentina/@-36.6399135,-56.6847789,19z/data=!4m6!3m5!1s0x959c6dabe016df5f:0x1d6059926c04eae9!8m2!3d-36.6399458!4d-56.6848245!16s%2Fg%2F11j1gh4dlm?hl=es&entry=ttu&g_ep=EgoyMDI2MDExMy4wIKXMDSoASAFQAw%3D%3D"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative pointer-events-auto"
                            >
                                <div className="w-12 h-12 bg-hunter-green rounded-full animate-ping absolute -inset-0 opacity-20"></div>
                                <div className="relative z-10 bg-hunter-green text-white p-3 rounded-full shadow-xl">
                                    <span className="material-icons-outlined">home</span>
                                </div>
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white dark:bg-hunter-green px-4 py-2 rounded-lg shadow-lg border border-snow/50 dark:border-snow/10 text-sm font-bold text-hunter-green dark:text-snow">
                                    El Refugio
                                </div>
                            </a>
                        </div>

                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                            <a
                                href="https://www.google.com/maps/place/El+Chalet+De+La+Argentina/@-36.6399135,-56.6847789,19z/data=!4m6!3m5!1s0x959c6dabe016df5f:0x1d6059926c04eae9!8m2!3d-36.6399458!4d-56.6848245!16s%2Fg%2F11j1gh4dlm?hl=es&entry=ttu&g_ep=EgoyMDI2MDExMy4wIKXMDSoASAFQAw%3D%3D"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white dark:bg-hunter-green p-2 rounded-lg shadow-md flex items-center gap-3 hover:bg-muted-olive/10 dark:hover:bg-snow/10 transition-colors pointer-events-auto group"
                            >
                                <span className="material-icons-outlined text-hunter-green dark:text-snow group-hover:scale-110 transition-transform">directions</span>
                                <span className="text-sm font-medium text-hunter-green dark:text-snow">¿Cómo llegar?</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contacto" className="bg-olive-bark text-snow py-16 md:py-20 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-hunter-green/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-center md:text-left">
                        <div className="col-span-1 md:col-span-2 flex flex-col items-center md:items-start">
                            <h2 className="text-3xl mb-6 font-bold text-snow">El Refugio</h2>
                            <p className="text-snow/70 max-w-sm mb-8">Tu casa lejos de casa. Un refugio de paz y diseño frente al bosque pensado para crear recuerdos inolvidables.</p>
                            <div className="flex gap-4">
                                <a href="https://www.instagram.com/elrefugio.aguasverdes/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-hunter-green/30 flex items-center justify-center hover:bg-hunter-green transition-colors">
                                    {/* Icon placeholder or img */}
                                    <span className="text-xs">IG</span>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6 text-muted-olive">Enlaces</h4>
                            <ul className="space-y-4 text-snow/70">
                                <li><a href="#" className="hover:text-snow transition-colors">Sobre nosotros</a></li>
                                <li><a href="#galeria" className="hover:text-snow transition-colors">Galería</a></li>
                                <li><a href="#reservas" className="hover:text-snow transition-colors">Reservas</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6 text-muted-olive">Contacto</h4>
                            <ul className="space-y-4 text-snow/70">
                                <li className="flex items-start justify-center md:justify-start gap-3">
                                    <span className="material-icons-outlined text-sm">location_on</span>
                                    <span>Yate Fortuna <br />Aguas Verdes</span>
                                </li>
                                <li className="flex items-center justify-center md:justify-start gap-3">
                                    <span className="material-icons-outlined text-sm">phone</span>

                                </li>
                                <li className="flex items-center justify-center md:justify-start gap-3">
                                    <span className="material-icons-outlined text-sm">email</span>
                                    hola@elrefugio.com
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-snow/10 text-center text-snow/50 text-sm">
                        <p>&copy; {new Date().getFullYear()} El Refugio. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
            {/* Gallery Modal */}
            {isGalleryOpen && selectedImageIndex !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-hunter-green/95 backdrop-blur-xl transition-all duration-500">
                    {/* Close Button */}
                    <button
                        onClick={closeGallery}
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
                    >
                        <span className="material-icons-outlined text-3xl">close</span>
                    </button>

                    {/* Navigation Buttons */}
                    <button
                        onClick={prevGalleryImage}
                        className="absolute left-4 md:left-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
                    >
                        <span className="material-icons-outlined text-3xl">west</span>
                    </button>

                    <button
                        onClick={nextGalleryImage}
                        className="absolute right-4 md:right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
                    >
                        <span className="material-icons-outlined text-3xl">east</span>
                    </button>

                    {/* Image and Caption Container */}
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8 pointer-events-none">
                        <div
                            key={selectedImageIndex}
                            className="relative max-w-5xl w-full h-fit flex flex-col items-center justify-center pointer-events-auto animate-in fade-in zoom-in duration-500"
                        >
                            <div className="relative w-full flex justify-center">
                                <img
                                    src={galleryImages[selectedImageIndex].src}
                                    alt={galleryImages[selectedImageIndex].caption}
                                    className="max-w-full max-h-[60vh] md:max-h-[70vh] object-contain rounded-lg shadow-2xl"
                                />
                            </div>

                            {/* Caption Section */}
                            <div className="mt-8 md:mt-12 text-center text-white max-w-2xl px-4 animate-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
                                <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-2 text-gold-sand opacity-90">
                                    {galleryImages[selectedImageIndex].location}
                                </p>
                                <h3 className="text-2xl md:text-4xl font-serif italic mb-6 leading-tight">
                                    {galleryImages[selectedImageIndex].caption}
                                </h3>

                                {/* Pagination Dots */}
                                <div className="flex justify-center gap-2">
                                    {galleryImages.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === selectedImageIndex ? 'bg-gold-sand w-6' : 'bg-white/20'}`}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
