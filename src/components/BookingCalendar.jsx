import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import "react-day-picker/style.css";
import { format, eachDayOfInterval, isPast, isSameDay, isBefore, addDays, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function BookingCalendar({ propertyId }) {
    const [range, setRange] = useState();
    const [disabledDays, setDisabledDays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!propertyId) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, "properties", propertyId, "bookings"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const bookedDates = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.startDate && data.endDate) {
                    const start = data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate);
                    const end = data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate);
                    bookedDates.push({ from: start, to: end });
                }
            });
            setDisabledDays(bookedDates);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [propertyId]);

    const today = startOfToday();
    const tomorrow = addDays(today, 1);

    const handleSelect = (newRange) => {
        if (newRange?.from && newRange?.to) {
            // Check if any day in the interval is booked or in the past
            const daysInInterval = eachDayOfInterval({ start: newRange.from, end: newRange.to });
            const hasReservedDay = daysInInterval.some(day => {
                // Check against disabledDays (which can be Date objects or {from, to} objects)
                const isBooked = disabledDays.some(booked => {
                    if (booked instanceof Date) return isSameDay(day, booked);
                    if (booked.from && booked.to) {
                        return (day >= booked.from && day <= booked.to);
                    }
                    return false;
                });

                // Check if it's past or today
                const isPastOrToday = isBefore(day, tomorrow);

                return isBooked || isPastOrToday;
            });

            if (hasReservedDay) {
                // If it contains a reserved day, only keep the first clicked date (the start)
                setRange({ from: newRange.from, to: undefined });
                return;
            }
        }
        setRange(newRange);
    };

    const handleWhatsAppClick = () => {
        if (range?.from && range?.to) {
            const startStr = format(range.from, "d 'de' MMMM", { locale: es });
            const endStr = format(range.to, "d 'de' MMMM", { locale: es });

            const message = `Hola, vi el departamento en la web. Me interesa reservar del ${startStr} al ${endStr}. ¿Está disponible?`;
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/5492216430365?text=${encodedMessage}`, '_blank');
        }
    };

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-xl max-w-md mx-auto my-8 border border-muted-olive/10">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 font-sans">Reservar Fechas</h2>

            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-hunter-green/20 border-t-hunter-green rounded-full animate-spin"></div>
                    <p className="text-blue-slate font-medium">Cargando disponibilidad...</p>
                </div>
            ) : (
                <div className="booking-calendar-wrapper" style={{
                    "--rdp-cell-size": "45px",
                    "--rdp-caption-font-size": "1.1rem",
                    "--rdp-accent-color": "#4a6c45",
                    "--rdp-background-color": "#f8f9fa",
                    color: "#1f2937"
                }}>
                    <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={handleSelect}
                        disabled={[{ before: tomorrow }, ...disabledDays]}
                        modifiers={{
                            booked: (date) => {
                                // Only mark as booked if it's in the future (not disabled by "past/today" logic)
                                const isFuture = !isBefore(date, tomorrow);
                                if (!isFuture) return false;

                                return disabledDays.some(booked => {
                                    if (booked instanceof Date) return isSameDay(date, booked);
                                    if (booked.from && booked.to) {
                                        // Normalize booking dates to start of day to ignore time
                                        const bookedStart = new Date(booked.from);
                                        bookedStart.setHours(0, 0, 0, 0);

                                        const bookedEnd = new Date(booked.to);
                                        bookedEnd.setHours(0, 0, 0, 0);

                                        return (date >= bookedStart && date <= bookedEnd);
                                    }
                                    return false;
                                });
                            },
                            available: (date) => {
                                // A date is available if it's future and not booked
                                const isFuture = !isBefore(date, tomorrow);
                                if (!isFuture) return false;

                                const isBooked = disabledDays.some(booked => {
                                    if (booked instanceof Date) return isSameDay(date, booked);
                                    if (booked.from && booked.to) {
                                        const bookedStart = new Date(booked.from);
                                        bookedStart.setHours(0, 0, 0, 0);

                                        const bookedEnd = new Date(booked.to);
                                        bookedEnd.setHours(0, 0, 0, 0);

                                        return (date >= bookedStart && date <= bookedEnd);
                                    }
                                    return false;
                                });
                                return !isBooked;
                            }
                        }}
                        modifiersClassNames={{
                            booked: 'rdp-day_booked', // Explicitly ensure class if needed, or just let default behavior work. Relying on CSS.
                            available: 'text-green-700 font-bold',
                        }}
                        locale={es}
                        footer={
                            <div className="mt-6 pt-4 border-t border-gray-100 italic">
                                {range?.from && range?.to ? (
                                    <p className="text-center text-hunter-green font-semibold">
                                        Del {format(range.from, "d 'de' MMM", { locale: es })} al {format(range.to, "d 'de' MMM", { locale: es })}
                                    </p>
                                ) : (
                                    <p className="text-center text-blue-slate text-sm">Selecciona tu llegada y salida.</p>
                                )}

                                {/* Legend */}
                                <div className="mt-6 flex flex-col gap-2 border-t border-gray-50 pt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-[#fca5a5] border border-[#f87171]"></div>
                                        <span className="text-xs text-gray-600 not-italic font-medium">No disponible</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-[#86efac] border border-[#4ade80]"></div>
                                        <span className="text-xs text-gray-600 not-italic font-medium">Disponible (consultar por Whatsapp)</span>
                                    </div>
                                </div>
                            </div>
                        }
                    />
                </div>
            )}

            {range?.from && range?.to && (
                <button
                    onClick={handleWhatsAppClick}
                    className="mt-8 w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 active:scale-95"
                >
                    <span>Consultar por WhatsApp</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.6 1.672.56 3.054.965 4.752z" /></svg>
                </button>
            )}
        </div>
    );
}
