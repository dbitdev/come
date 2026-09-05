"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { db } from '@/lib/firebase';
import AdminGuard from "@/components/AdminGuard";
import MediaUploader from "@/components/MediaUploader";
import { slugify } from '@/lib/utils';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    doc, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    serverTimestamp,
    setDoc
} from "firebase/firestore";
import styles from "./admin.module.css";
import { 
    FaChartBar, FaUtensils, FaUsers, FaStar, FaShieldAlt, 
    FaTrash, FaEdit, FaPlus, FaBookOpen, FaConciergeBell, 
    FaSync, FaSave, FaTimes, FaImage, FaMapMarkerAlt, FaUpload 
} from 'react-icons/fa';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const TITULOS: Record<string, string> = {
    dashboard: "Resumen",
    restaurantes: "Negocios y lugares",
    chefs: "Directorio de chefs",
    guias: "Guías interactivas",
    menus: "Menús digitales",
    nominaciones: "Nominaciones por revisar",
};

export default function AdminDashboard() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState<'dashboard' | 'restaurantes' | 'chefs' | 'menus' | 'guias' | 'nominaciones'>('dashboard');
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [chefs, setChefs] = useState<any[]>([]);
    const [guides, setGuides] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [chefNominations, setChefNominations] = useState<any[]>([]);
    const [placeNominations, setPlaceNominations] = useState<any[]>([]);
    const [workingId, setWorkingId] = useState<string | null>(null);
    const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
    const [editingChef, setEditingChef] = useState<any>(null);
    const [editingGuide, setEditingGuide] = useState<any>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSyncingChefs, setIsSyncingChefs] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    const APP_DOMAIN = "comeapp.com.mx";

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        if (!db) return;
        setLoading(true);
        try {
            // Fetch Restaurants
            const restSnapshot = await getDocs(collection(db, "come"));
            const restData = restSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRestaurants(restData);
            // Antes esto eran los 8 primeros registros, no solicitudes: el panel
            // decía "actividad reciente" mostrando negocios ya publicados.
            setLeads(restData.filter((r: any) => r.status === 'pending'));

            const [chefNomSnap, placeNomSnap] = await Promise.all([
                getDocs(collection(db, "chef_nominations")),
                getDocs(collection(db, "place_nominations")),
            ]);
            setChefNominations(chefNomSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setPlaceNominations(placeNomSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Chefs
            const chefsSnapshot = await getDocs(collection(db, "chefs"));
            const chefsData = chefsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setChefs(chefsData);

            // Fetch Guides
            const guidesSnapshot = await getDocs(collection(db, "guides"));
            const guidesData = guidesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGuides(guidesData);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    // Publicar una nominación la copia a su colección definitiva y la retira de
    // la bandeja; rechazar sólo la borra.
    const publicarNominacion = async (nominacion: any, destino: 'chefs' | 'come', origen: string) => {
        if (!db) return;
        setWorkingId(nominacion.id);
        try {
            const { id, status, ...datos } = nominacion;
            void status;
            await addDoc(collection(db, destino), {
                ...datos,
                slug: slugify(datos.name || datos.restaurantName || id),
                status: 'published',
                publishedAt: serverTimestamp(),
            });
            await deleteDoc(doc(db, origen, id));
            await fetchData();
        } catch (err) {
            console.error("No se pudo publicar la nominación:", err);
            alert("No se pudo publicar. Revisa la consola para el detalle.");
        } finally {
            setWorkingId(null);
        }
    };

    const rechazarNominacion = async (nominacionId: string, origen: string) => {
        if (!db || !confirm("¿Descartar esta nominación? No se puede deshacer.")) return;
        setWorkingId(nominacionId);
        try {
            await deleteDoc(doc(db, origen, nominacionId));
            await fetchData();
        } catch (err) {
            console.error("No se pudo descartar la nominación:", err);
        } finally {
            setWorkingId(null);
        }
    };

    // Aprobar un negocio registrado lo hace visible en el directorio público.
    const publicarNegocio = async (negocioId: string) => {
        if (!db) return;
        setWorkingId(negocioId);
        try {
            await updateDoc(doc(db, "come", negocioId), { status: 'published', publishedAt: serverTimestamp() });
            await fetchData();
        } catch (err) {
            console.error("No se pudo publicar el negocio:", err);
        } finally {
            setWorkingId(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingRestaurant || !storage) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `restaurants/${editingRestaurant.id || 'new'}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            setEditingRestaurant({ ...editingRestaurant, image: downloadURL });
            alert("Imagen subida con éxito");
        } catch (err) {
            console.error("Error uploading image:", err);
            alert("Error al subir la imagen");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSyncMichelin = async () => {
        if (!db || isSyncing) return;
        setIsSyncing(true);
        try {
            const michelinLocales = [
                {
                    name: "Pujol",
                    distincion: "2 Estrellas + Estrella Verde",
                    chef: "Enrique Olvera",
                    category: "Mexicana Contemporánea",
                    address: "Tennyson 133, Polanco, Miguel Hidalgo, CDMX",
                    signatureDishes: ["Mole Madre, Mole Nuevo", "Taco Omakase de temporada"],
                    rating: 4.9,
                    isMichelin: true,
                    michelinStars: 2,
                    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200",
                    description: "Cocina de alta calidad, excepcional o extraordinaria. 2 Estrellas + Estrella Verde."
                },
                {
                    name: "Quintonil",
                    distincion: "2 Estrellas",
                    chef: "Jorge Vallejo",
                    category: "Mexicana Moderna",
                    address: "Newton 55, Polanco, Miguel Hidalgo, CDMX",
                    signatureDishes: ["Tartar de aguacate con escamoles", "Nieve de nopal"],
                    rating: 4.9,
                    isMichelin: true,
                    michelinStars: 2,
                    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200",
                    description: "Cocina de alta calidad, excepcional o extraordinaria."
                },
                {
                    name: "Taquería El Califa de León",
                    distincion: "1 Estrella",
                    chef: "Arturo Rivera Martínez",
                    category: "Taquería Tradicional",
                    address: "Av. Ribera de San Cosme 56, San Rafael, CDMX",
                    signatureDishes: ["Taco Gaonera", "Taco de Bistec"],
                    rating: 4.7,
                    isMichelin: true,
                    michelinStars: 1,
                    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200",
                    description: "Taquería Tradicional con 1 Estrella Michelin."
                },
                {
                    name: "Levadura de Olla",
                    distincion: "1 Estrella",
                    chef: "Thalía Barrios",
                    category: "Oaxaqueña Tradicional",
                    address: "C. de Manuel García Vigil 304, Centro, Oaxaca",
                    signatureDishes: ["Ensalada de tomates nativos", "Mole de mesa"],
                    rating: 4.8,
                    isMichelin: true,
                    michelinStars: 1,
                    image: "https://images.unsplash.com/photo-1581488109695-1ed571217e4f?auto=format&fit=crop&w=1200",
                    description: "Cocina Oaxaqueña Tradicional destacada con 1 Estrella."
                },
                {
                    name: "Animalón",
                    distincion: "1 Estrella",
                    chef: "Javier Plascencia / Oscar Torres",
                    category: "Baja Med",
                    address: "Carretera Tecate-Ensenada Km. 83, Baja California",
                    signatureDishes: ["Menú bajo el encino de 200 años"],
                    rating: 4.8,
                    isMichelin: true,
                    michelinStars: 1,
                    image: "https://images.unsplash.com/photo-1550966841-36f9adac97ce?auto=format&fit=crop&w=1200",
                    description: "Experiencia gastronómica bajo un encino centenario."
                },
                {
                    name: "Le Chique",
                    distincion: "1 Estrella",
                    chef: "Jonatán Gómez Luna",
                    category: "Vanguardia Mexicana",
                    address: "Azul Beach Resort, Puerto Morelos, Quintana Roo",
                    signatureDishes: ["Viaje culinario por México (Menú degustación)"],
                    rating: 4.9,
                    isMichelin: true,
                    michelinStars: 1,
                    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200",
                    description: "Vanguardia Mexicana en el Caribe."
                },
                {
                    name: "Contramar",
                    distincion: "Bib Gourmand",
                    chef: "Gabriela Cámara",
                    category: "Mariscos",
                    address: "Durango 200, Roma Norte, CDMX",
                    signatureDishes: ["Pescado a la talla"],
                    rating: 4.8,
                    isMichelin: false,
                    michelinStars: 0,
                    lat: 19.4201,
                    lng: -99.1633,
                    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200",
                    description: "Mejor relación calidad-precio."
                },
                {
                    name: "Alfonsina",
                    distincion: "Bib Gourmand",
                    chef: "Jorge León",
                    category: "Oaxaqueña de Mercado",
                    address: "Calle Garcia Vigil 5, San Juan Bautista la Raya, Oaxaca",
                    lat: 17.0094,
                    lng: -96.7225,
                    signatureDishes: ["Tlayudas gourmet", "Mole negro"],
                    rating: 4.8,
                    isMichelin: false,
                    michelinStars: 0,
                    image: "https://images.unsplash.com/photo-1541544741938-0af808871bdc?auto=format&fit=crop&w=1200",
                    description: "Bib Gourmand: Cocina excepcional por menos de $900 MXN."
                }
            ];

            for (const locale of michelinLocales) {
                const data = {
                    restaurantName: locale.name,
                    category: locale.category,
                    address: locale.address,
                    lat: locale.lat || 0,
                    lng: locale.lng || 0,
                    chef: locale.chef,
                    description: locale.description,
                    signatureDishes: locale.signatureDishes,
                    rating: locale.rating,
                    isMichelin: locale.isMichelin,
                    michelinStars: locale.michelinStars || 0,
                    awards: locale.distincion,
                    image: locale.image,
                    lastUpdated: serverTimestamp(),
                    subdomain: locale.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + "." + APP_DOMAIN
                };
                
                const existing = restaurants.find(r => r.restaurantName === locale.name);
                if (existing) {
                    console.log(`Skipping existing restaurant to preserve manual edits: ${locale.name}`);
                    continue; // Skip if already exists
                } else {
                    await addDoc(collection(db, "come"), data);
                }
            }
            alert("Sincronización Michelin completada con éxito");
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error sincronizando: " + (err as any).message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSaveRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !editingRestaurant) return;
        try {
            const { id, ...data } = editingRestaurant;
            Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
            
            const rName = data.restaurantName || data.name || "";
            data.subdomain = rName.toLowerCase().replace(/[^a-z0-9]/g, '-') + "." + APP_DOMAIN;

            if (id) {
                await updateDoc(doc(db, "come", id), {
                    ...data,
                    lastUpdated: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, "come"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
            }
            setEditingRestaurant(null);
            fetchData();
            alert("Restaurante guardado con éxito");
        } catch (err) {
            console.error(err);
            alert("Error al guardar");
        }
    };

    const handleDeleteRestaurant = async (id: string) => {
        if (!db || !window.confirm("¿Estás seguro de eliminar este restaurante?")) return;
        try {
            await deleteDoc(doc(db, "come", id));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveChef = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !editingChef) return;
        try {
            const { id, ...data } = editingChef;
            if (id) {
                await updateDoc(doc(db, "chefs", id), {
                    ...data,
                    lastUpdated: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, "chefs"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
            }
            setEditingChef(null);
            fetchData();
            alert("Chef guardado con éxito");
        } catch (err) {
            console.error(err);
            alert("Error al guardar chef");
        }
    };
    const handleSaveGuide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !editingGuide) return;
        try {
            const { id, ...data } = editingGuide;
            const guideSlug = data.slug || slugify(data.title);
            
            const gData = {
                ...data,
                slug: guideSlug,
                updatedAt: new Date().toISOString(),
                restaurantIds: data.stops?.map((s: any) => s.location?.restaurantId).filter(Boolean) || []
            };

            if (id) {
                await updateDoc(doc(db, "guides", id), gData);
            } else {
                await addDoc(collection(db, "guides"), {
                    ...gData,
                    createdAt: new Date().toISOString(),
                    status: 'published'
                });
            }
            setEditingGuide(null);
            fetchData();
            alert("Guía guardada con éxito");
        } catch (err) {
            console.error(err);
            alert("Error al guardar guía");
        }
    };

    const handleDeleteGuide = async (id: string) => {
        if (!db || !window.confirm("¿Estás seguro de eliminar esta guía?")) return;
        try {
            await deleteDoc(doc(db, "guides", id));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteChef = async (id: string) => {
        if (!db || !window.confirm("¿Estás seguro de eliminar este chef?")) return;
        try {
            await deleteDoc(doc(db, "chefs", id));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AdminGuard>
            <div className={styles.adminWrapper}>
                <aside className={styles.sidebar}>
                    <div className={styles.adminLogo}>
                        <FaShieldAlt /> <span>Come Admin</span>
                    </div>
                    <nav className={styles.nav}>
                        <button onClick={() => setActiveSection('dashboard')} className={activeSection === 'dashboard' ? styles.navItemActive : styles.navItem}><FaChartBar /> Dashboard</button>
                        <button onClick={() => setActiveSection('restaurantes')} className={activeSection === 'restaurantes' ? styles.navItemActive : styles.navItem}><FaUtensils /> Negocios / Lugares</button>
                        <button onClick={() => setActiveSection('chefs')} className={activeSection === 'chefs' ? styles.navItemActive : styles.navItem}><FaUsers /> Directorio de Chefs</button>
                        <button onClick={() => setActiveSection('guias')} className={activeSection === 'guias' ? styles.navItemActive : styles.navItem}><FaMapMarkerAlt /> Guías Interactivas</button>
                        <button onClick={() => setActiveSection('menus')} className={activeSection === 'menus' ? styles.navItemActive : styles.navItem}><FaBookOpen /> Menús Digitales</button>
                        <button onClick={() => setActiveSection('nominaciones')} className={activeSection === 'nominaciones' ? styles.navItemActive : styles.navItem}>
                            <FaConciergeBell /> Nominaciones
                            {(chefNominations.length + placeNominations.length + leads.length) > 0 && <span className={styles.badge}>{chefNominations.length + placeNominations.length + leads.length}</span>}
                        </button>
                    </nav>
                    
                    <button 
                        onClick={handleSyncMichelin} 
                        className={styles.primaryBtn} 
                        style={{ marginTop: 'auto', background: isSyncing ? '#444' : 'var(--primary)' }}
                        disabled={isSyncing}
                    >
                        <FaSync className={isSyncing ? styles.spin : ""} /> {isSyncing ? "Sincronizando..." : "Sincronizar Michelin"}
                    </button>
                </aside>

                <main className={styles.mainContent}>
                    <header className={styles.header}>
                        <div>
                            <span className={styles.eyebrow}>PANEL DE REDACCIÓN</span>
                            <h1>{TITULOS[activeSection]}</h1>
                        </div>
                        <div className={styles.userTag}>{user?.email}</div>
                    </header>

                    {loading ? (
                        <div className={styles.loading}>Cargando datos...</div>
                    ) : (
                        <>
                            {activeSection === 'dashboard' && (
                                <>
                                    <div className={styles.statsGrid}>
                                        <div className={styles.statCard}>
                                            <h3>Negocios Totales</h3>
                                            <p>{restaurants.length}</p>
                                        </div>
                                        <div className={styles.statCard}>
                                            <h3>Estrellas Michelin</h3>
                                            <p>{restaurants.filter(r => r.isMichelin).length}</p>
                                        </div>
                                        <div className={styles.statCard}>
                                            <h3>Catálogo Digital</h3>
                                            <p>{restaurants.filter(r => r.menu?.length > 0).length}</p>
                                        </div>
                                        <div className={styles.statCard}>
                                            <h3>Por revisar</h3>
                                            <p>{chefNominations.length + placeNominations.length + leads.length}</p>
                                        </div>
                                    </div>
                                    
                                    <section className={styles.tableSection}>
                                        <h2>Negocios en espera de aprobación</h2>
                                        <table className={styles.adminTable}>
                                            <thead>
                                                <tr>
                                                    <th>Nombre</th>
                                                    <th>Categoría</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leads.map(lead => (
                                                    <tr key={lead.id}>
                                                        <td>{lead.restaurantName || lead.name}</td>
                                                        <td><span className={styles.subdomainTag}>{lead.category}</span></td>
                                                        <td className={styles.actions}>
                                                            <button className={styles.editBtn} onClick={() => { setEditingRestaurant(lead); setActiveSection('restaurantes'); }}><FaEdit /></button>
                                                            <button className={styles.publishBtn} disabled={workingId === lead.id} onClick={() => publicarNegocio(lead.id)}>Publicar</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {leads.length === 0 && (
                                                    <tr><td colSpan={3} className={styles.emptyRow}>No hay negocios pendientes de revisión.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </section>
                                </>
                            )}

                            {activeSection === 'nominaciones' && (
                                <>
                                    <section className={styles.tableSection}>
                                        <h2>Lugares nominados ({placeNominations.length})</h2>
                                        <table className={styles.adminTable}>
                                            <thead>
                                                <tr><th>Lugar</th><th>Categoría</th><th>Dirección</th><th>Acciones</th></tr>
                                            </thead>
                                            <tbody>
                                                {placeNominations.map(nom => (
                                                    <tr key={nom.id}>
                                                        <td>{nom.restaurantName}</td>
                                                        <td><span className={styles.subdomainTag}>{nom.category}</span></td>
                                                        <td>{nom.address}</td>
                                                        <td className={styles.actions}>
                                                            <button className={styles.publishBtn} disabled={workingId === nom.id} onClick={() => publicarNominacion(nom, 'come', 'place_nominations')}>Publicar</button>
                                                            <button className={styles.deleteBtn} disabled={workingId === nom.id} onClick={() => rechazarNominacion(nom.id, 'place_nominations')}><FaTrash /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {placeNominations.length === 0 && (
                                                    <tr><td colSpan={4} className={styles.emptyRow}>Sin nominaciones de lugares.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </section>

                                    <section className={styles.tableSection}>
                                        <h2>Chefs nominados ({chefNominations.length})</h2>
                                        <table className={styles.adminTable}>
                                            <thead>
                                                <tr><th>Chef</th><th>Especialidad</th><th>Trayectoria</th><th>Acciones</th></tr>
                                            </thead>
                                            <tbody>
                                                {chefNominations.map(nom => (
                                                    <tr key={nom.id}>
                                                        <td>{nom.name}</td>
                                                        <td><span className={styles.subdomainTag}>{nom.specialty}</span></td>
                                                        <td className={styles.clampCell}>{nom.trajectory || nom.bio}</td>
                                                        <td className={styles.actions}>
                                                            <button className={styles.publishBtn} disabled={workingId === nom.id} onClick={() => publicarNominacion(nom, 'chefs', 'chef_nominations')}>Publicar</button>
                                                            <button className={styles.deleteBtn} disabled={workingId === nom.id} onClick={() => rechazarNominacion(nom.id, 'chef_nominations')}><FaTrash /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {chefNominations.length === 0 && (
                                                    <tr><td colSpan={4} className={styles.emptyRow}>Sin nominaciones de chefs.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </section>
                                </>
                            )}

                            {activeSection === 'restaurantes' && (
                                <section>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                        <h2>Lista de Restaurantes</h2>
                                        <button className={styles.primaryBtn} onClick={() => setEditingRestaurant({})}><FaPlus /> Nuevo Lugar</button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <div className={styles.tableSection} style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                            <table className={styles.adminTable}>
                                                <thead>
                                                    <tr>
                                                        <th>Restaurante</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {restaurants.map(r => (
                                                        <tr key={r.id} style={{ background: editingRestaurant?.id === r.id ? '#f0f7ff' : 'transparent' }}>
                                                            <td>
                                                                <div style={{ fontWeight: 700 }}>{r.restaurantName || r.name}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>{r.category}</div>
                                                            </td>
                                                            <td className={styles.actions}>
                                                                <button className={styles.editBtn} onClick={() => setEditingRestaurant(r)}><FaEdit /></button>
                                                                <button className={styles.deleteBtn} onClick={() => handleDeleteRestaurant(r.id)}><FaTrash /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className={styles.formOuter}>
                                            {editingRestaurant ? (
                                                <form onSubmit={handleSaveRestaurant} className={styles.adminForm}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <h3>{editingRestaurant.id ? "Editar Perfil" : "Nuevo Perfil"}</h3>
                                                        <button type="button" className={styles.editBtn} onClick={() => setEditingRestaurant(null)}><FaTimes /></button>
                                                    </div>
                                                    
                                                    <label>Nombre del Restaurante</label>
                                                    <input 
                                                        value={editingRestaurant.restaurantName || editingRestaurant.name || ''} 
                                                        onChange={e => setEditingRestaurant({...editingRestaurant, restaurantName: e.target.value})}
                                                        placeholder="Nombre..."
                                                    />

                                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label>Categoría</label>
                                                            <input 
                                                                value={editingRestaurant.category || ''} 
                                                                onChange={e => setEditingRestaurant({...editingRestaurant, category: e.target.value})}
                                                                placeholder="Ej. Mexicana Moderna"
                                                            />
                                                        </div>
                                                        <div style={{ width: '100px' }}>
                                                            <label>Estrellas</label>
                                                            <input 
                                                                type="number" 
                                                                value={editingRestaurant.michelinStars || 0} 
                                                                onChange={e => setEditingRestaurant({...editingRestaurant, michelinStars: parseInt(e.target.value), isMichelin: parseInt(e.target.value) > 0})}
                                                            />
                                                        </div>
                                                    </div>

                                                    <label>Chef</label>
                                                    <input 
                                                        value={editingRestaurant.chef || ''} 
                                                        onChange={e => setEditingRestaurant({...editingRestaurant, chef: e.target.value})}
                                                        placeholder="Nombre del chef..."
                                                    />

                                                    <label>Descripción</label>
                                                    <textarea 
                                                        value={editingRestaurant.description || ''} 
                                                        onChange={e => setEditingRestaurant({...editingRestaurant, description: e.target.value})}
                                                        rows={4}
                                                    />

                                                    <label>Imagen del Restaurante</label>
                                                    <MediaUploader 
                                                        folder="restaurants" 
                                                        onUploadComplete={(url) => setEditingRestaurant({...editingRestaurant, image: url})} 
                                                    />
                                                    <input 
                                                        value={editingRestaurant.image || ''} 
                                                        onChange={e => setEditingRestaurant({...editingRestaurant, image: e.target.value})}
                                                        placeholder="O ingresa URL manual..."
                                                    />

                                                    <label>Dirección</label>
                                                    <input 
                                                        value={editingRestaurant.address || ''} 
                                                        onChange={e => setEditingRestaurant({...editingRestaurant, address: e.target.value})}
                                                    />

                                                    <label>Subdominio / URL de Menú (ej: pujol)</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <input 
                                                            value={editingRestaurant.subdomain?.split('.')[0] || ''} 
                                                            onChange={e => setEditingRestaurant({...editingRestaurant, subdomain: `${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${APP_DOMAIN}`})}
                                                            placeholder="ej: nombre-restaurante"
                                                            style={{ flex: 1 }}
                                                        />
                                                        <span style={{ fontSize: '0.9rem', color: '#888' }}>.{APP_DOMAIN}</span>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label>Latitud</label>
                                                            <input 
                                                                type="number" step="any"
                                                                value={editingRestaurant.lat || ''} 
                                                                onChange={e => setEditingRestaurant({...editingRestaurant, lat: parseFloat(e.target.value)})}
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label>Longitud</label>
                                                            <input 
                                                                type="number" step="any"
                                                                value={editingRestaurant.lng || ''} 
                                                                onChange={e => setEditingRestaurant({...editingRestaurant, lng: parseFloat(e.target.value)})}
                                                            />
                                                        </div>
                                                    </div>

                                                    <button type="submit" className={styles.primaryBtn}>
                                                        <FaSave /> Guardar Cambios
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className={styles.emptyState}>
                                                    <FaUtensils size={40} />
                                                    <p>Selecciona un restaurante para editar o crea uno nuevo.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeSection === 'chefs' && (
                                <section>
                                    <div className={styles.sectionHead}>
                                        <h2>Directorio de chefs</h2>
                                        <button className={styles.primaryBtn} onClick={() => setEditingChef({})}><FaPlus /> Nuevo chef</button>
                                    </div>

                                    <div className={styles.splitLayout}>
                                        <div className={styles.tableSection}>
                                            <table className={styles.adminTable}>
                                                <thead>
                                                    <tr>
                                                        <th>Chef</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {chefs.map(chef => (
                                                        <tr key={chef.id} className={editingChef?.id === chef.id ? styles.rowActive : undefined}>
                                                            <td>
                                                                <div className={styles.rowMain}>{chef.name || "Sin nombre"}</div>
                                                                <div className={styles.rowSub}>
                                                                    {[chef.specialty, chef.restaurant, chef.ubicacion].filter(Boolean).join(" · ") || "Sin datos"}
                                                                </div>
                                                            </td>
                                                            <td className={styles.actions}>
                                                                <button className={styles.editBtn} onClick={() => setEditingChef(chef)}><FaEdit /></button>
                                                                <button className={styles.deleteBtn} onClick={() => handleDeleteChef(chef.id)}><FaTrash /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className={styles.formOuter}>
                                            {editingChef ? (
                                                <form onSubmit={handleSaveChef} className={styles.adminForm}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <h3>{editingChef.id ? "Editar Chef" : "Nuevo Chef"}</h3>
                                                        <button type="button" className={styles.editBtn} onClick={() => setEditingChef(null)}><FaTimes /></button>
                                                    </div>
                                                    
                                                    <label>Nombre Completo</label>
                                                    <input 
                                                        value={editingChef.name || ''} 
                                                        onChange={e => setEditingChef({...editingChef, name: e.target.value})}
                                                    />

                                                    <label>Especialidad</label>
                                                    <input
                                                        placeholder="Ej. Oaxaqueña tradicional"
                                                        value={editingChef.specialty || ''}
                                                        onChange={e => setEditingChef({...editingChef, specialty: e.target.value})}
                                                    />

                                                    <label>Restaurante principal</label>
                                                    <input 
                                                        value={editingChef.restaurant || ''} 
                                                        onChange={e => setEditingChef({...editingChef, restaurant: e.target.value})}
                                                    />

                                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label>Ubicación</label>
                                                            <input 
                                                                value={editingChef.ubicacion || ''} 
                                                                onChange={e => setEditingChef({...editingChef, name: e.target.value})}
                                                            />
                                                        </div>
                                                        <div style={{ width: '100px' }}>
                                                            <label>Estrellas</label>
                                                            <input 
                                                                type="number" 
                                                                value={editingChef.estrellas || 0} 
                                                                onChange={e => setEditingChef({...editingChef, estrellas: parseInt(e.target.value)})}
                                                            />
                                                        </div>
                                                    </div>

                                                    <label>Biografía Corta</label>
                                                    <textarea 
                                                        value={editingChef.bio || ''} 
                                                        onChange={e => setEditingChef({...editingChef, bio: e.target.value})}
                                                        rows={3}
                                                    />

                                                    <label>Imagen del Chef</label>
                                                    <MediaUploader 
                                                        folder="chefs" 
                                                        onUploadComplete={(url) => setEditingChef({...editingChef, image: url})} 
                                                    />
                                                    <input 
                                                        value={editingChef.image || ''} 
                                                        onChange={e => setEditingChef({...editingChef, image: e.target.value})}
                                                        placeholder="URL de la foto..."
                                                    />

                                                    <label>Redes Sociales</label>
                                                    <input 
                                                        value={editingChef.redes || ''} 
                                                        onChange={e => setEditingChef({...editingChef, redes: e.target.value})}
                                                        placeholder="@usuario"
                                                    />

                                                    <button type="submit" className={styles.primaryBtn}>
                                                        <FaSave /> Guardar Chef
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className={styles.emptyState}>
                                                    <FaUsers size={40} />
                                                    <p>Selecciona un chef para editar o crea uno nuevo.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                             {activeSection === 'guias' && (
                                <section>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                        <h2>Gestión de Guías</h2>
                                        <button className={styles.primaryBtn} onClick={() => setEditingGuide({ title: '', description: '', stops: [], restaurantIds: [] })}><FaPlus /> Nueva Guía</button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <div className={styles.tableSection}>
                                            <table className={styles.adminTable}>
                                                <thead>
                                                    <tr>
                                                        <th>Guía</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {guides.map(guide => (
                                                        <tr key={guide.id} style={{ background: editingGuide?.id === guide.id ? '#f0f7ff' : 'transparent' }}>
                                                            <td>
                                                                <div style={{ fontWeight: 700 }}>{guide.title}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>{guide.stops?.length || 0} paradas / {guide.status}</div>
                                                            </td>
                                                            <td className={styles.actions}>
                                                                <button className={styles.editBtn} onClick={() => setEditingGuide(guide)}><FaEdit /></button>
                                                                <button className={styles.deleteBtn} onClick={() => handleDeleteGuide(guide.id)}><FaTrash /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className={styles.formOuter}>
                                            {editingGuide ? (
                                                <form onSubmit={handleSaveGuide} className={styles.adminForm}>
                                                    <h3>{editingGuide.id ? "Editar Guía" : "Nueva Guía"}</h3>
                                                    
                                                    <label>Título de la Guía</label>
                                                    <input 
                                                        value={editingGuide.title || ''} 
                                                        onChange={e => setEditingGuide({...editingGuide, title: e.target.value})}
                                                    />

                                                    <label>Imagen de Portada (Hero)</label>
                                                    <MediaUploader 
                                                        folder="guides" 
                                                        onUploadComplete={(url) => setEditingGuide({...editingGuide, heroImage: url})} 
                                                    />
                                                    <input 
                                                        value={editingGuide.heroImage || ''} 
                                                        onChange={e => setEditingGuide({...editingGuide, heroImage: e.target.value})}
                                                        placeholder="URL de la imagen..."
                                                    />

                                                    <label>Descripción</label>
                                                    <textarea 
                                                        value={editingGuide.description || ''} 
                                                        onChange={e => setEditingGuide({...editingGuide, description: e.target.value})}
                                                        rows={3}
                                                    />

                                                    <label>Autor</label>
                                                    <input 
                                                        value={editingGuide.authorName || 'Admin'} 
                                                        onChange={e => setEditingGuide({...editingGuide, authorName: e.target.value})}
                                                    />

                                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                                                        <h4 style={{ marginBottom: '1rem' }}>Paradas ({editingGuide.stops?.length || 0})</h4>
                                                        <button 
                                                            type="button" 
                                                            className={styles.editBtn}
                                                            onClick={() => {
                                                                const newStop = { id: Date.now().toString(), title: '', content: '', order: (editingGuide.stops?.length || 0) + 1, location: { lat: 0, lng: -99.1332, name: '', address: '' } };
                                                                setEditingGuide({...editingGuide, stops: [...(editingGuide.stops || []), newStop]});
                                                            }}
                                                        >
                                                            <FaPlus /> Agregar Parada
                                                        </button>
                                                        
                                                        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                                                            * El editor avanzado de paradas y mapas proximamente. Use el JSON para edición manual avanzada.
                                                        </p>
                                                    </div>

                                                    <button type="submit" className={styles.primaryBtn} style={{ marginTop: '2rem' }}>
                                                        <FaSave /> Guardar Guía
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className={styles.emptyState}>
                                                    <FaMapMarkerAlt size={40} />
                                                    <p>Selecciona una guía para editar o crea una nueva.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeSection === 'menus' && (
                                <section className={styles.tableSection}>
                                    <h2>Gestión de Cartas Digitales</h2>
                                    <table className={styles.adminTable}>
                                        <thead>
                                            <tr>
                                                <th>Restaurante</th>
                                                <th>Platillos</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {restaurants.filter(r => r.menu?.length > 0).map(r => (
                                                <tr key={r.id}>
                                                    <td>{r.restaurantName}</td>
                                                    <td>{r.menu.length} platillos</td>
                                                    <td className={styles.actions}>
                                                        <button className={styles.editBtn} title="Próximamente: Editor de Menú"><FaBookOpen /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </section>
                            )}
                        </>
                    )}
                </main>
            </div>
            <style jsx>{`
                label { font-size: 0.8rem; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: -1rem; }
                .formOuter { background: #fff; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .${styles.spin} { animation: spin 1s linear infinite; }
            `}</style>
        </AdminGuard>
    );
}
