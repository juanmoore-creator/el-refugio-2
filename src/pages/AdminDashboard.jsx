import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import "react-day-picker/style.css";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const PROPERTIES = [
    { id: 'casa-principal', name: 'El Refugio (Casa Principal)' },
    { id: 'cabana', name: 'La Cabaña' }
];

export default function AdminDashboard() {
    const [selectedProperty, setSelectedProperty] = useState(PROPERTIES[0].id);
    const [range, setRange] = useState();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [disabledDays, setDisabledDays] = useState([]);
    const [dailyPrice, setDailyPrice] = useState('');
    const [priceLoading, setPriceLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "properties", selectedProperty, "bookings"),
                orderBy("startDate", "desc")
            );
            const querySnapshot = await getDocs(q);
            const bookedList = [];
            const disabledRanges = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const start = data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate);
                const end = data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate);

                bookedList.push({
                    id: doc.id,
                    ...data,
                    start,
                    end
                });
                disabledRanges.push({ from: start, to: end });
            });

            setBookings(bookedList);
            setDisabledDays(disabledRanges);
        } catch (error) {
            console.error("Error fetching bookings: ", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrice = async () => {
        setPriceLoading(true);
        try {
            const docRef = doc(db, "properties", selectedProperty, "settings", "pricing");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setDailyPrice(docSnap.data().dailyPrice);
            } else {
                setDailyPrice(''); // Reset if no price set for this property
            }
        } catch (error) {
            console.error("Error fetching price: ", error);
        } finally {
            setPriceLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchPrice();
    }, [selectedProperty]);

    const handleUpdatePrice = async () => {
        if (!dailyPrice) {
            alert("El precio no puede estar vacío.");
            return;
        }

        setSaveLoading(true);
        try {
            await setDoc(doc(db, "properties", selectedProperty, "settings", "pricing"), {
                dailyPrice: dailyPrice,
                lastUpdated: Timestamp.now()
            });
            alert("Precio actualizado correctamente.");
        } catch (error) {
            console.error("Error updating price: ", error);
            alert("Error al actualizar el precio.");
        } finally {
            setSaveLoading(false);
        }
    };

    const handleBlockDates = async () => {
        if (!range?.from || !range?.to) {
            alert("Por favor selecciona un rango de fechas.");
            return;
        }

        try {
            await addDoc(collection(db, "properties", selectedProperty, "bookings"), {
                startDate: Timestamp.fromDate(range.from),
                endDate: Timestamp.fromDate(range.to),
                createdAt: Timestamp.now(),
                type: 'admin'
            });
            setRange(undefined);
            fetchBookings();
            alert("Fechas bloqueadas con éxito.");
        } catch (error) {
            console.error("Error blocking dates: ", error);
            alert("Error al bloquear fechas.");
        }
    };

    const handleDeleteBooking = async (id) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este bloqueo?")) {
            try {
                await deleteDoc(doc(db, "properties", selectedProperty, "bookings", id));
                fetchBookings();
            } catch (error) {
                console.error("Error deleting booking: ", error);
                alert("Error al eliminar el bloqueo.");
            }
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto bg-snow min-h-screen">
            <h1 className="text-4xl font-bold mb-8 text-hunter-green border-b pb-4">Panel de Administración</h1>

            {/* Property Selector */}
            <div className="mb-8">
                <label className="block text-sm font-medium text-olive-bark mb-2">Seleccionar Propiedad a Gestionar</label>
                <div className="flex gap-4">
                    {PROPERTIES.map((prop) => (
                        <button
                            key={prop.id}
                            onClick={() => setSelectedProperty(prop.id)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-sm ${selectedProperty === prop.id
                                    ? 'bg-hunter-green text-white shadow-md scale-105 ring-2 ring-hunter-green ring-offset-2'
                                    : 'bg-white text-blue-slate hover:bg-gray-50 border border-muted-olive/20'
                                }`}
                        >
                            {prop.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
                {/* Calendar Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-muted-olive/20">
                    <h2 className="text-2xl font-semibold mb-6 text-olive-bark">Bloquear Calendario</h2>
                    <div className="flex justify-center">
                        <DayPicker
                            mode="range"
                            selected={range}
                            onSelect={setRange}
                            disabled={disabledDays}
                            locale={es}
                            footer={
                                <div className="mt-4 p-4 bg-muted-olive/10 rounded-lg">
                                    {range?.from && range?.to ? (
                                        <p className="text-sm font-medium text-hunter-green">
                                            Seleccionado: <span className="font-bold">{format(range.from, "d 'de' MMM", { locale: es })}</span> al <span className="font-bold">{format(range.to, "d 'de' MMM", { locale: es })}</span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-blue-slate">Selecciona un rango para bloquear.</p>
                                    )}
                                </div>
                            }
                        />
                    </div>
                    <button
                        onClick={handleBlockDates}
                        disabled={!range?.from || !range?.to}
                        className={`mt-6 w-full py-3 rounded-xl font-bold transition-all ${!range?.from || !range?.to
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-hunter-green text-white hover:bg-olive-bark shadow-lg shadow-hunter-green/20'
                            }`}
                    >
                        Bloquear Fechas Seleccionadas
                    </button>
                </div>

                {/* List Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-muted-olive/20">
                    <h2 className="text-2xl font-semibold mb-6 text-olive-bark">Bloqueos Actuales</h2>
                    {loading ? (
                        <p className="text-center py-8">Cargando bloqueos...</p>
                    ) : bookings.length === 0 ? (
                        <p className="text-center py-8 text-blue-slate italic">No hay fechas bloqueadas actualmente.</p>
                    ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="flex justify-between items-center p-4 bg-snow rounded-xl border border-muted-olive/10 group hover:border-muted-olive/30 transition-all">
                                    <div>
                                        <p className="font-bold text-hunter-green">
                                            {format(booking.start, "d 'de' MMMM", { locale: es })} - {format(booking.end, "d 'de' MMMM", { locale: es })}
                                        </p>
                                        <p className="text-xs text-blue-slate mt-1 opacity-60">
                                            Creado el {format(booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt), "d/M HH:mm")}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBooking(booking.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Eliminar bloqueo"
                                    >
                                        <span className="material-icons-outlined">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Price Management Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-muted-olive/20 mt-8">
                    <h2 className="text-2xl font-semibold mb-6 text-olive-bark flex items-center gap-2">
                        <span className="material-icons-outlined">payments</span>
                        Precio de la Estadía
                    </h2>
                    <div className="max-w-md mx-auto">
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-blue-slate mb-2">Precio por día (ej: 75.000)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-hunter-green font-bold">$</span>
                                    <input
                                        type="text"
                                        value={dailyPrice}
                                        onChange={(e) => setDailyPrice(e.target.value)}
                                        placeholder="75.000"
                                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-muted-olive/30 focus:outline-none focus:ring-2 focus:ring-hunter-green/20 font-bold text-hunter-green"
                                        disabled={priceLoading}
                                    />
                                </div>
                                {priceLoading && <p className="text-xs text-blue-slate mt-2 italic">Cargando precio actual...</p>}
                            </div>
                            <button
                                onClick={handleUpdatePrice}
                                disabled={saveLoading || !dailyPrice}
                                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${saveLoading || !dailyPrice
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-hunter-green text-white hover:bg-olive-bark shadow-lg shadow-hunter-green/20'
                                    }`}
                            >
                                {saveLoading ? (
                                    <>
                                        <span className="animate-spin material-icons-outlined text-sm">sync</span>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons-outlined">save</span>
                                        Actualizar Precio
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <a href="/" className="text-olive-bark hover:text-hunter-green font-medium underline flex items-center justify-center gap-2">
                    <span className="material-icons-outlined text-sm">west</span>
                    Volver a la Home
                </a>
            </div>
        </div>
    );
}
