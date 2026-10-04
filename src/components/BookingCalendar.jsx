import React, { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import "react-day-picker/style.css";
import { format, eachDayOfInterval, isBefore, addDays, startOfToday, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Helper to normalize any date/timestamp to local midnight (00:00:00.000)
const toMidnight = (dateInput) => {
    if (!dateInput) return null;
    const d = dateInput instanceof Timestamp
        ? dateInput.toDate()
        : (dateInput instanceof Date ? new Date(dateInput.getTime()) : new Date(dateInput));
    d.setHours(0, 0, 0, 0);
    return d;
};

export default function BookingCalendar({ propertyId, propertyName }) {
    const [range, setRange] = useState();
    const [bookedIntervals, setBookedIntervals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedbackMessage, setFeedbackMessage] = useState(null);

    useEffect(() => {
        if (!propertyId) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, "properties", propertyId, "bookings"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const list = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.startDate && data.endDate) {
                    const start = toMidnight(data.startDate);
                    const end = toMidnight(data.endDate);
                    if (start && end) {
                        list.push({ from: start, to: end });
                    }
                }
            });
            setBookedIntervals(list);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bookings: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [propertyId]);

    const today = useMemo(() => toMidnight(startOfToday()), []);
    const tomorrow = useMemo(() => addDays(today, 1), [today]);

    // Check if a single day falls inside any booked interval
    const isDayBooked = (day) => {
        const target = toMidnight(day);
        if (!target) return false;
        return bookedIntervals.some(({ from, to }) => target >= from && target <= to);
    };

    // Check if an interval contains any booked or past date
    const rangeContainsBookedDay = (from, to) => {
        if (!from || !to) return false;
        const start = toMidnight(from);
        const end = toMidnight(to);
        const [intStart, intEnd] = start <= end ? [start, end] : [end, start];
        const days = eachDayOfInterval({ start: intStart, end: intEnd });
        return days.some(d => isDayBooked(d) || isBefore(d, tomorrow));
    };

    const handleSelect = (newRange, triggerDate) => {
        setFeedbackMessage(null);

        // Deselection: user clicked to clear or outside
        if (!newRange) {
            setRange(undefined);
            return;
        }

        const normTrigger = toMidnight(triggerDate);

        // If triggerDate itself is disabled or booked, ignore
        if (normTrigger && (isDayBooked(normTrigger) || isBefore(normTrigger, tomorrow))) {
            return;
        }

        // Case 1: Only check-in is selected
        if (newRange.from && !newRange.to) {
            // Clicking the same check-in date again clears the selection
            if (range?.from && !range?.to && normTrigger && range.from.getTime() === normTrigger.getTime()) {
                setRange(undefined);
                return;
            }
            setRange({ from: toMidnight(newRange.from), to: undefined });
            return;
        }

        // Case 2: Both check-in and check-out are selected
        if (newRange.from && newRange.to) {
            const start = toMidnight(newRange.from);
            const end = toMidnight(newRange.to);
            const [first, second] = start <= end ? [start, end] : [end, start];

            // Verify if there are any booked dates inside the range
            if (rangeContainsBookedDay(first, second)) {
                // Do NOT lock to the old date! Reset check-in to the newly clicked date
                const freshStart = normTrigger || second;
                setRange({ from: freshStart, to: undefined });
                setFeedbackMessage(`El período seleccionado contenía fechas ocupadas. Se inició una nueva reserva desde el ${format(freshStart, "d 'de' MMMM", { locale: es })}.`);
                return;
            }

            setRange({ from: first, to: second });
        }
    };

    const handleClear = () => {
        setRange(undefined);
        setFeedbackMessage(null);
    };

    const nights = range?.from && range?.to
        ? differenceInCalendarDays(range.to, range.from)
        : 0;

    const handleWhatsAppClick = () => {
        if (range?.from && range?.to) {
            const startStr = format(range.from, "d 'de' MMMM", { locale: es });
            const endStr = format(range.to, "d 'de' MMMM", { locale: es });
            const propTitle = propertyName || (propertyId === 'yate-fortuna' ? 'Yate Fortuna' : 'Av. Crucero la Argentina');
            const nightsText = `${nights} ${nights === 1 ? 'noche' : 'noches'}`;

            const message = `Hola! Vi la web de El Refugio y me interesa consultar disponibilidad para ${propTitle} del ${startStr} al ${endStr} (${nightsText}). ¿Está disponible?`;
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/5492216128091?text=${encodedMessage}`, '_blank');
        }
    };

    // Disabled matchers for DayPicker
    const disabledDays = useMemo(() => [
        { before: tomorrow },
        ...bookedIntervals
    ], [tomorrow, bookedIntervals]);

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto my-8 border border-muted-olive/10 transition-all duration-300">
            <div className="w-full flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 font-sans">Reservar Fechas</h2>
                {range?.from && (
                    <button
                        onClick={handleClear}
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Borrar selección"
                    >
                        <span className="material-icons-outlined text-sm">close</span>
                        <span>Limpiar</span>
                    </button>
                )}
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-hunter-green/20 border-t-hunter-green rounded-full animate-spin"></div>
                    <p className="text-blue-slate font-medium">Cargando disponibilidad...</p>
                </div>
            ) : (
                <div className="booking-calendar-wrapper w-full flex flex-col items-center">
                    <DayPicker
                        mode="range"
                        min={2}
                        numberOfMonths={1}
                        selected={range}
                        onSelect={handleSelect}
                        disabled={disabledDays}
                        modifiers={{
                            booked: (date) => isDayBooked(date),
                            available: (date) => {
                                const norm = toMidnight(date);
                                return !isBefore(norm, tomorrow) && !isDayBooked(norm);
                            }
                        }}
                        modifiersClassNames={{
                            booked: 'rdp-day_booked',
                            available: 'text-green-700 font-bold',
                        }}
                        locale={es}
                        footer={
                            <div className="mt-6 pt-4 border-t border-gray-100 w-full">
                                {feedbackMessage && (
                                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg text-center animate-fade-in font-medium">
                                        {feedbackMessage}
                                    </div>
                                )}

                                {range?.from && range?.to ? (
                                    <div className="text-center">
                                        <p className="text-hunter-green font-bold text-base">
                                            Del {format(range.from, "d 'de' MMM", { locale: es })} al {format(range.to, "d 'de' MMM", { locale: es })}
                                        </p>
                                        <p className="text-xs text-olive-bark font-medium mt-0.5">
                                            {nights} {nights === 1 ? 'noche' : 'noches'} de estadía
                                        </p>
                                    </div>
                                ) : range?.from ? (
                                    <p className="text-center text-olive-bark text-sm font-medium">
                                        Llegada: <span className="font-bold text-hunter-green">{format(range.from, "d 'de' MMMM", { locale: es })}</span>. Seleccioná fecha de salida.
                                    </p>
                                ) : (
                                    <p className="text-center text-blue-slate text-sm">Selecciona tu llegada y salida.</p>
                                )}

                                {/* Legend */}
                                <div className="mt-4 flex items-center justify-center gap-6 border-t border-gray-100 pt-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#fee2e2] border border-[#f87171]"></div>
                                        <span className="text-xs text-gray-600 font-medium">Ocupado</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#86efac] border border-[#4ade80]"></div>
                                        <span className="text-xs text-gray-600 font-medium">Disponible</span>
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
                    className="mt-6 w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 active:scale-95 cursor-pointer"
                >
                    <span>Consultar por WhatsApp ({nights} {nights === 1 ? 'noche' : 'noches'})</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.6 1.672.56 3.054.965 4.752z" /></svg>
                </button>
            )}
        </div>
    );
}
