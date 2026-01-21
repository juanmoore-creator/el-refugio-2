import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="flex flex-col md:flex-row h-screen w-full font-montserrat">
            {/* Left Section - Property 1 */}
            <div className="relative flex-1 h-1/2 md:h-full w-full group overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-white">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                >
                    <source src="/videos/video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500 flex flex-col items-center justify-center text-center p-6">
                    <h2 className="text-white text-4xl md:text-5xl font-bold mb-6 tracking-wider drop-shadow-lg transform transition-transform duration-500 group-hover:-translate-y-2">
                        EL REFUGIO
                    </h2>
                    <p className="text-gray-200 text-lg md:text-xl mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                        Casa Principal
                    </p>
                    <Link
                        to="/propiedad/casa-principal"
                        className="px-8 py-3 bg-olive-bark/80 hover:bg-olive-bark text-white font-semibold rounded-full backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-105 shadow-lg uppercase tracking-widest text-sm"
                    >
                        Explorar
                    </Link>
                </div>
            </div>

            {/* Right Section - Property 2 */}
            <div className="relative flex-1 h-1/2 md:h-full w-full group overflow-hidden">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                >
                    <source src="/videos/video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500 flex flex-col items-center justify-center text-center p-6">
                    <h2 className="text-white text-4xl md:text-5xl font-bold mb-6 tracking-wider drop-shadow-lg transform transition-transform duration-500 group-hover:-translate-y-2">
                        LA CABAÑA
                    </h2>
                    <p className="text-gray-200 text-lg md:text-xl mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                        Experiencia Íntima
                    </p>
                    <Link
                        to="/propiedad/cabana"
                        className="px-8 py-3 bg-olive-bark/80 hover:bg-olive-bark text-white font-semibold rounded-full backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-105 shadow-lg uppercase tracking-widest text-sm"
                    >
                        Explorar
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Landing;
