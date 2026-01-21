import React from 'react';

const Polaroid = ({ src, caption, rotation }) => {
    return (
        <div
            className={`bg-white p-4 shadow-lg transform transition-transform duration-300 hover:scale-105 hover:z-10 ${rotation} w-64 flex-shrink-0`}
        >
            <div className="aspect-square bg-gray-200 mb-4 overflow-hidden">
                <img src={src} alt={caption} className="w-full h-full object-cover" />
            </div>
            <p className="text-center font-handwriting text-gray-700 text-sm md:text-base font-semibold">{caption}</p>
        </div>
    );
};

const PolaroidGallery = () => {
    // Placeholder images from unsplash or similar would be good, but I'll use placeholders for now
    // In a real scenario, these would be real assets
    const photos = [
        { id: 1, src: "/images/2.jpeg", caption: "Amanecer en la costa", rotation: "-rotate-2" },
        { id: 2, src: "/images/4.jpeg", caption: "Relax total", rotation: "rotate-3" },
        { id: 3, src: "/images/5.jpeg", caption: "Nuestros rincones", rotation: "-rotate-1" },
        { id: 4, src: "/images/3.jpeg", caption: "Vista al mar", rotation: "rotate-2" },
    ];

    return (
        <section className="py-16 bg-refugio-sage bg-opacity-20 overflow-hidden">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl text-center text-refugio-forest mb-12 font-bold">Momentos en El Refugio</h2>
                <div className="flex flex-wrap justify-center gap-8 md:gap-12 pb-8">
                    {photos.map((photo) => (
                        <Polaroid
                            key={photo.id}
                            src={photo.src}
                            caption={photo.caption}
                            rotation={photo.rotation}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PolaroidGallery;
