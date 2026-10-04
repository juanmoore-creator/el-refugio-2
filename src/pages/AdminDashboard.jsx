import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import "react-day-picker/style.css";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, Timestamp, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const PROPERTIES = [
    { id: 'yate-fortuna', name: 'Yate Fortuna (Casa Principal)' },
    { id: 'av-crucero-la-argentina', name: 'Av. Crucero la Argentina (Experiencia Íntima)' }
];

export default function AdminDashboard() {
    const [selectedProperty, setSelectedProperty] = useState(PROPERTIES[0].id);
    const [range, setRange] = useState();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [disabledDays, setDisabledDays] = useState([]);
    const [dailyPrice, setDailyPrice] = useState('');
    const [useCustomMessage, setUseCustomMessage] = useState(false);
    const [customMessage, setCustomMessage] = useState('');
    const [priceLoading, setPriceLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    // New Booking Fields
    const [clientName, setClientName] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [note, setNote] = useState('');
    const [isPaid, setIsPaid] = useState(false);

    // Inline Editing
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

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

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const start = data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate);
                const end = data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate);

                bookedList.push({
                    id: docSnap.id,
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
                const data = docSnap.data();
                setDailyPrice(data.dailyPrice || '');
                setUseCustomMessage(data.useCustomMessage || false);
                setCustomMessage(data.customMessage || '');
            } else {
                setDailyPrice('');
                setUseCustomMessage(false);
                setCustomMessage('');
            }
        } catch (error) {
            console.error("Error fetching price: ", error);
        } finally {
            setPriceLoading(false);
        }
    };

    useEffect(() => {
        setRange(undefined);
        setEditingId(null);
        fetchBookings();
        fetchPrice();
    }, [selectedProperty]);

    const handleUpdatePrice = async () => {
        if (!useCustomMessage && !dailyPrice) {
            alert("El precio no puede estar vacío si no usás un mensaje personalizado.");
            return;
        }

        setSaveLoading(true);
        try {
            await setDoc(doc(db, "properties", selectedProperty, "settings", "pricing"), {
                dailyPrice: dailyPrice,
                useCustomMessage: useCustomMessage,
                customMessage: customMessage,
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
                type: 'admin',
                clientName: clientName || 'Sin nombre',
                totalAmount: totalAmount || 0,
                paidAmount: paidAmount || 0,
                note: note || '',
                isPaid: isPaid || false
            });

            // Reset form
            setRange(undefined);
            setClientName('');
            setTotalAmount('');
            setPaidAmount('');
            setNote('');
            setIsPaid(false);

            fetchBookings();
            alert("Fechas bloqueadas con éxito.");
        } catch (error) {
            console.error("Error blocking dates: ", error);
            alert("Error al bloquear fechas.");
        }
    };

    const startEditing = (booking) => {
        setEditingId(booking.id);
        setEditForm({
            clientName: booking.clientName || '',
            totalAmount: booking.totalAmount || '',
            paidAmount: booking.paidAmount || '',
            note: booking.note || '',
            isPaid: booking.isPaid || false
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleUpdateBooking = async (id) => {
        try {
            const bookingRef = doc(db, "properties", selectedProperty, "bookings", id);
            await updateDoc(bookingRef, {
                clientName: editForm.clientName,
                totalAmount: editForm.totalAmount,
                paidAmount: editForm.paidAmount,
                note: editForm.note,
                isPaid: editForm.isPaid
            });
            setEditingId(null);
            fetchBookings();
            alert("Reserva actualizada correctamente");
        } catch (error) {
            console.error("Error updating booking:", error);
            alert("Error al actualizar la reserva");
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

    const currentPropertyName = PROPERTIES.find(p => p.id === selectedProperty)?.name || '';

    return (
        <div className="p-8 max-w-6xl mx-auto bg-snow min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b pb-4">
                <div>
                    <h1 className="text-4xl font-bold text-hunter-green">Panel de Administración</h1>
                    <p className="text-blue-slate text-sm mt-1">Gestión multipropiedad de El Refugio</p>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href={`/propiedad/${selectedProperty}?public=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-white text-hunter-green border border-hunter-green/30 rounded-xl font-bold hover:bg-snow shadow-sm transition-all flex items-center gap-2 text-sm"
                    >
                        <span className="material-icons-outlined text-sm">open_in_new</span>
                        Ver {selectedProperty === 'yate-fortuna' ? 'Yate Fortuna' : 'Crucero'}
                    </a>
                    <a
                        href="/?public=true"
                        className="px-5 py-2.5 bg-hunter-green text-white rounded-xl font-bold hover:bg-olive-bark shadow-lg shadow-hunter-green/20 transition-all flex items-center gap-2 text-sm"
                    >
                        <span className="material-icons-outlined text-sm">visibility</span>
                        Ver Landing
                    </a>
                </div>
            </div>

            {/* Property Tabs */}
            <div className="mb-8">
                <label className="block text-sm font-semibold text-olive-bark uppercase tracking-wider mb-3">
                    Seleccionar Propiedad
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {PROPERTIES.map((prop) => {
                        const isSelected = selectedProperty === prop.id;
                        return (
                            <button
                                key={prop.id}
                                onClick={() => setSelectedProperty(prop.id)}
                                className={`p-4 rounded-2xl font-bold transition-all text-left flex items-center justify-between border ${isSelected
                                    ? 'bg-hunter-green text-white shadow-md border-hunter-green ring-2 ring-hunter-green ring-offset-2'
                                    : 'bg-white text-hunter-green hover:bg-gray-50 border-muted-olive/20'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-icons-outlined">
                                        {prop.id === 'yate-fortuna' ? 'house' : 'apartment'}
                                    </span>
                                    <span>{prop.name}</span>
                                </div>
                                {isSelected && (
                                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        Activa
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Calendar Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-muted-olive/20">
                    <h2 className="text-2xl font-semibold mb-2 text-olive-bark">Bloquear Calendario</h2>
                    <p className="text-xs text-blue-slate mb-6">Bloquear fechas para: <span className="font-bold text-hunter-green">{currentPropertyName}</span></p>

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

                    {/* Booking Form Inputs */}
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-olive-bark mb-1">Nombre del Cliente / Huésped</label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="w-full p-2.5 border border-muted-olive/30 rounded-xl focus:outline-none focus:border-hunter-green"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-olive-bark mb-1">Monto Total</label>
                                <input
                                    type="number"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                    className="w-full p-2.5 border border-muted-olive/30 rounded-xl focus:outline-none focus:border-hunter-green"
                                    placeholder="$"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-olive-bark mb-1">Seña / Pago Recibido</label>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    className="w-full p-2.5 border border-muted-olive/30 rounded-xl focus:outline-none focus:border-hunter-green"
                                    placeholder="$"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-olive-bark mb-1">Notas Internas</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full p-2.5 border border-muted-olive/30 rounded-xl focus:outline-none focus:border-hunter-green h-20 resize-none text-sm"
                                placeholder="Teléfono, cantidad de personas, peticiones especiales..."
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="isPaid"
                                checked={isPaid}
                                onChange={(e) => setIsPaid(e.target.checked)}
                                className="w-4 h-4 text-hunter-green rounded focus:ring-hunter-green cursor-pointer"
                            />
                            <label htmlFor="isPaid" className="text-sm font-medium text-olive-bark cursor-pointer">
                                Pago Completo (sin saldo pendiente)
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleBlockDates}
                        disabled={!range?.from || !range?.to}
                        className={`mt-6 w-full py-3 rounded-xl font-bold transition-all ${!range?.from || !range?.to
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-hunter-green text-white hover:bg-olive-bark shadow-lg shadow-hunter-green/20'
                            }`}
                    >
                        Bloquear Fechas en {selectedProperty === 'yate-fortuna' ? 'Yate Fortuna' : 'Crucero'}
                    </button>
                </div>

                {/* List Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-muted-olive/20 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-olive-bark">Bloqueos Registrados</h2>
                            <p className="text-xs text-blue-slate mt-0.5">{bookings.length} reserva(s) en esta propiedad</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-hunter-green/20 border-t-hunter-green rounded-full animate-spin"></div>
                            <p className="text-sm text-blue-slate">Cargando bloqueos...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-16 text-blue-slate italic">
                            <span className="material-icons-outlined text-4xl text-gray-300 mb-2 block">event_busy</span>
                            No hay fechas bloqueadas actualmente para esta propiedad.
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2 custom-scrollbar">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="p-4 bg-snow rounded-xl border border-muted-olive/10 group hover:border-muted-olive/30 transition-all">
                                    {editingId === booking.id ? (
                                        // Edit Mode
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                                <span className="font-bold text-hunter-green text-sm">
                                                    {format(booking.start, "d MMM", { locale: es })} - {format(booking.end, "d MMM", { locale: es })}
                                                </span>
                                            </div>
                                            <input
                                                type="text"
                                                value={editForm.clientName}
                                                onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                                                className="w-full p-2 text-sm border rounded-lg"
                                                placeholder="Nombre Cliente"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="number"
                                                    value={editForm.totalAmount}
                                                    onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })}
                                                    className="w-full p-2 text-sm border rounded-lg"
                                                    placeholder="Total $"
                                                />
                                                <input
                                                    type="number"
                                                    value={editForm.paidAmount}
                                                    onChange={(e) => setEditForm({ ...editForm, paidAmount: e.target.value })}
                                                    className="w-full p-2 text-sm border rounded-lg"
                                                    placeholder="Seña $"
                                                />
                                            </div>
                                            <textarea
                                                value={editForm.note}
                                                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                                                className="w-full p-2 text-sm border rounded-lg h-16 resize-none"
                                                placeholder="Notas..."
                                            />
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`edit-paid-${booking.id}`}
                                                    checked={editForm.isPaid}
                                                    onChange={(e) => setEditForm({ ...editForm, isPaid: e.target.checked })}
                                                    className="w-4 h-4 text-hunter-green rounded"
                                                />
                                                <label htmlFor={`edit-paid-${booking.id}`} className="text-sm font-medium">Pago Completo</label>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={cancelEditing} className="px-3 py-1.5 text-xs bg-gray-200 rounded-lg hover:bg-gray-300 font-medium">Cancelar</button>
                                                <button onClick={() => handleUpdateBooking(booking.id)} className="px-3 py-1.5 text-xs bg-hunter-green text-white rounded-lg hover:bg-opacity-90 font-medium">Guardar Cambios</button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <p className="font-bold text-hunter-green">
                                                    {format(booking.start, "d 'de' MMMM", { locale: es })} - {format(booking.end, "d 'de' MMMM", { locale: es })}
                                                </p>
                                                <p className="font-semibold text-lg text-olive-bark mt-0.5">
                                                    {booking.clientName || 'Cliente sin nombre'}
                                                </p>
                                                <div className="text-sm text-blue-slate mt-1 space-y-0.5">
                                                    <p>Total: ${booking.totalAmount || 0} | Pagado: ${booking.paidAmount || 0}</p>
                                                    <p className={(booking.totalAmount - booking.paidAmount) > 0 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                                                        Resta: ${booking.totalAmount - booking.paidAmount}
                                                    </p>
                                                    {booking.note && (
                                                        <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 rounded-lg text-xs italic border border-yellow-100">
                                                            "{booking.note}"
                                                        </div>
                                                    )}
                                                    {booking.isPaid && (
                                                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-bold">
                                                            PAGADO TOTAL
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => startEditing(booking)}
                                                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                                                    title="Editar reserva"
                                                >
                                                    <span className="material-icons-outlined text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBooking(booking.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Eliminar bloqueo"
                                                >
                                                    <span className="material-icons-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Price Management Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-muted-olive/20 mt-4">
                    <h2 className="text-2xl font-semibold mb-2 text-olive-bark flex items-center gap-2">
                        <span className="material-icons-outlined">payments</span>
                        Precio de la Estadía — {currentPropertyName}
                    </h2>
                    <p className="text-xs text-blue-slate mb-6">Configurar tarifa o mensaje público visible en la web para esta casa.</p>

                    <div className="max-w-xl mx-auto">
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-blue-slate mb-2">Precio por día / noche (ej: 75.000)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-hunter-green font-bold">$</span>
                                    <input
                                        type="text"
                                        value={dailyPrice}
                                        onChange={(e) => setDailyPrice(e.target.value)}
                                        placeholder="75.000"
                                        className={`w-full pl-8 pr-4 py-3 rounded-xl border border-muted-olive/30 focus:outline-none focus:ring-2 focus:ring-hunter-green/20 font-bold text-hunter-green ${useCustomMessage ? 'bg-gray-100 opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={priceLoading || useCustomMessage}
                                    />
                                </div>

                                <div className="mt-4 p-4 border border-muted-olive/20 rounded-xl bg-snow">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="useCustomMessage"
                                            checked={useCustomMessage}
                                            onChange={(e) => setUseCustomMessage(e.target.checked)}
                                            className="w-4 h-4 text-hunter-green rounded focus:ring-hunter-green cursor-pointer"
                                        />
                                        <label htmlFor="useCustomMessage" className="text-sm font-medium text-olive-bark cursor-pointer select-none">
                                            Mostrar un mensaje personalizado en lugar del precio
                                        </label>
                                    </div>
                                    {useCustomMessage && (
                                        <div className="mt-3">
                                            <input
                                                type="text"
                                                value={customMessage}
                                                onChange={(e) => setCustomMessage(e.target.value)}
                                                placeholder="Ej: Consultar por WhatsApp"
                                                className="w-full p-2.5 border border-muted-olive/30 rounded-lg focus:outline-none focus:border-hunter-green text-sm"
                                            />
                                        </div>
                                    )}
                                </div>

                                {priceLoading && <p className="text-xs text-blue-slate mt-2 italic">Cargando precio actual...</p>}
                            </div>
                            <button
                                onClick={handleUpdatePrice}
                                disabled={saveLoading || (!useCustomMessage && !dailyPrice) || (useCustomMessage && !customMessage)}
                                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${saveLoading || (!useCustomMessage && !dailyPrice) || (useCustomMessage && !customMessage)
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
                                        Actualizar Precio para {selectedProperty === 'yate-fortuna' ? 'Yate Fortuna' : 'Crucero'}
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
                    Volver a la Landing Principal
                </a>
            </div>
        </div>
    );
}
