"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Guide, GuideStop } from '@/types/guide';
import { useAuth } from '@/context/AuthContext';
import styles from './GuideCreator.module.css';
import { 
    Plus, 
    Trash2, 
    MapPin, 
    Save, 
    Image as ImageIcon, 
    Search, 
    ChevronUp, 
    ChevronDown,
    X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GuideCreator() {
    const { user } = useAuth();
    const router = useRouter();
    const [guide, setGuide] = useState<Partial<Guide>>({
        title: '',
        description: '',
        heroImage: '',
        status: 'draft',
        stops: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeStopTarget, setActiveStopTarget] = useState<number | null>(null);

    // Search for restaurants in the DB
    const handleSearch = useCallback(async (val: string) => {
        setSearchTerm(val);
        if (val.length < 3) {
            setSearchResults([]);
            return;
        }
        if (!db) return;
        setIsSearching(true);
        try {
            const q = query(collection(db, "business_leads"), limit(10));
            const snapshot = await getDocs(q);
            const results = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((r: any) => 
                    (r.restaurantName || r.name || "").toLowerCase().includes(val.toLowerCase()) ||
                    (r.address || "").toLowerCase().includes(val.toLowerCase())
                );
            setSearchResults(results);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const addStop = () => {
        const newStop: GuideStop = {
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            content: '',
            order: guide.stops?.length || 0,
            location: { lat: 19.4326, lng: -99.1332, name: 'Ubicación seleccionada' }
        };
        setGuide(prev => ({ ...prev, stops: [...(prev.stops || []), newStop] }));
    };

    const removeStop = (id: string) => {
        setGuide(prev => ({ ...prev, stops: prev.stops?.filter(s => s.id !== id) }));
    };

    const updateStop = (index: number, fields: Partial<GuideStop>) => {
        const newStops = [...(guide.stops || [])];
        newStops[index] = { ...newStops[index], ...fields };
        setGuide(prev => ({ ...prev, stops: newStops }));
    };

    const selectRestaurantForStop = (restaurant: any) => {
        if (activeStopTarget === null) return;
        updateStop(activeStopTarget, {
            title: restaurant.restaurantName || restaurant.name,
            location: {
                lat: restaurant.lat || 19.4326,
                lng: restaurant.lng || -99.1332,
                name: restaurant.restaurantName || restaurant.name,
                address: restaurant.address,
                restaurantId: restaurant.id
            }
        });
        setActiveStopTarget(null);
        setSearchTerm("");
        setSearchResults([]);
    };

    const handleSave = async () => {
        if (!guide.title || !guide.stops?.length) {
            alert("Por favor completa el título y agrega al menos una parada.");
            return;
        }
        setIsSaving(true);
        try {
            const restaurantIds = (guide.stops || [])
                .map(s => s.location.restaurantId)
                .filter(id => !!id) as string[];

            const slug = guide.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const finalGuide = {
                ...guide,
                slug,
                restaurantIds,
                authorId: user?.uid,
                authorName: user?.displayName || 'Admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            if (!db) throw new Error("Database not initialized");
            const docRef = await addDoc(collection(db, "guides"), finalGuide);
            router.push(`/guias/${slug}`);
        } catch (err) {
            console.error("Save error:", err);
            alert("Error al guardar la guía.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>Crear Nueva Guía / Ruta</h1>
                    <button 
                        className={styles.saveBtn} 
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Guardando..." : <><Save size={18} /> Publicar Guía</>}
                    </button>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.formSection}>
                    <div className={styles.card}>
                        <h2 className={styles.sectionTitle}>Información General</h2>
                        <div className={styles.inputGroup}>
                            <label>Título de la Guía</label>
                            <input 
                                type="text" 
                                placeholder="Ej: Las mejores hamburguesas de la CDMX" 
                                value={guide.title}
                                onChange={e => setGuide(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Descripción / Introducción</label>
                            <textarea 
                                placeholder="Escribe una breve introducción..."
                                value={guide.description}
                                onChange={e => setGuide(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>URL Imagen de Portada</label>
                            <div className={styles.imageInput}>
                                <ImageIcon size={20} />
                                <input 
                                    type="text" 
                                    placeholder="https://..."
                                    value={guide.heroImage}
                                    onChange={e => setGuide(prev => ({ ...prev, heroImage: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.stopsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Paradas de la Ruta</h2>
                            <button className={styles.addStopBtn} onClick={addStop}>
                                <Plus size={18} /> Agregar Parada
                            </button>
                        </div>

                        {guide.stops?.map((stop, index) => (
                            <div key={stop.id} className={styles.stopCard}>
                                <div className={styles.stopHeader}>
                                    <span className={styles.stopIndex}>{index + 1}</span>
                                    <input 
                                        type="text" 
                                        placeholder="Título de esta parada"
                                        className={styles.stopTitleInput}
                                        value={stop.title}
                                        onChange={e => updateStop(index, { title: e.target.value })}
                                    />
                                    <button 
                                        className={styles.deleteBtn}
                                        onClick={() => removeStop(stop.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className={styles.stopBody}>
                                    <div className={styles.stopContentArea}>
                                        <textarea 
                                            placeholder="Describe este lugar y por qué es parte de la ruta..."
                                            value={stop.content}
                                            onChange={e => updateStop(index, { content: e.target.value })}
                                        />
                                        <div className={styles.imageInput} style={{ marginTop: '1rem' }}>
                                            <ImageIcon size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="URL Imagen (opcional)"
                                                value={stop.image || ""}
                                                onChange={e => updateStop(index, { image: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.stopExtra}>
                                        <div 
                                            className={`${styles.locationSelector} ${stop.location.restaurantId ? styles.hasLocation : ""}`}
                                            onClick={() => setActiveStopTarget(index)}
                                        >
                                            <MapPin size={18} />
                                            <span>
                                                {stop.location.restaurantId 
                                                    ? stop.location.name 
                                                    : "Vincular restaurante..."}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {guide.stops?.length === 0 && (
                            <div className={styles.emptyStops} onClick={addStop}>
                                <Plus size={48} />
                                <p>Comienza a crear tu ruta agregando la primera parada</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Restaurant Search Overlay */}
            {activeStopTarget !== null && (
                <div className={styles.overlay}>
                    <div className={styles.searchModal}>
                        <div className={styles.searchModalHeader}>
                            <h3>Vincular Restaurante</h3>
                            <button onClick={() => setActiveStopTarget(null)}><X /></button>
                        </div>
                        <div className={styles.searchBar}>
                            <Search size={20} />
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Buscar restaurante por nombre..."
                                value={searchTerm}
                                onChange={e => handleSearch(e.target.value)}
                            />
                        </div>
                        <div className={styles.resultsList}>
                            {isSearching && <div className={styles.searchingText}>Buscando...</div>}
                            {searchResults.map(res => (
                                <div 
                                    key={res.id} 
                                    className={styles.resultItem}
                                    onClick={() => selectRestaurantForStop(res)}
                                >
                                    <strong>{res.restaurantName || res.name}</strong>
                                    <p>{res.address || "Sin dirección"}</p>
                                </div>
                            ))}
                            {searchTerm.length >= 3 && searchResults.length === 0 && !isSearching && (
                                <div className={styles.noResults}>No se encontraron restaurantes.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
