"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { db } from '@/lib/firebase';
import AdminGuard from "@/components/AdminGuard";
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

export default function AdminDashboard() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState<'dashboard' | 'restaurantes' | 'chefs' | 'menus'>('dashboard');
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [chefs, setChefs] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
    const [editingChef, setEditingChef] = useState<any>(null);
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
            const restSnapshot = await getDocs(collection(db, "business_leads"));
            const restData = restSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRestaurants(restData);
            setLeads(restData.slice(0, 8));

            // Fetch Chefs
            const chefsSnapshot = await getDocs(collection(db, "chefs"));
            const chefsData = chefsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setChefs(chefsData);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
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
                    await addDoc(collection(db, "business_leads"), data);
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
                await updateDoc(doc(db, "business_leads", id), {
                    ...data,
                    lastUpdated: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, "business_leads"), {
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
            await deleteDoc(doc(db, "business_leads", id));
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
                        <button onClick={() => setActiveSection('menus')} className={activeSection === 'menus' ? styles.navItemActive : styles.navItem}><FaBookOpen /> Menús Digitales</button>
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
                        <h1>{activeSection === 'restaurantes' ? "Gestión de Negocios" : activeSection.toUpperCase()}</h1>
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
                                    </div>
                                    
                                    <section className={styles.tableSection}>
                                        <h2>Actividad Reciente</h2>
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
                                                        </td>
                                                    </tr>
                                                ))}
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
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        <div className={styles.imagePlaceholder} style={{ 
                                                            backgroundImage: editingRestaurant.image ? `url(${editingRestaurant.image})` : 'none',
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            width: '60px', 
                                                            height: '60px', 
                                                            borderRadius: '8px',
                                                            backgroundColor: '#f0f0f0',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: '#ccc',
                                                            overflow: 'hidden'
                                                        }}>
                                                            {!editingRestaurant.image && <FaImage size={24} />}
                                                        </div>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*"
                                                            onChange={handleFileUpload}
                                                            style={{ display: 'none' }}
                                                            id="image-upload"
                                                        />
                                                        <label htmlFor="image-upload" className={styles.editBtn} style={{ cursor: 'pointer', padding: '0.8rem 1.2rem', width: 'auto', display: 'flex', gap: '8px', border: '1px solid #ddd', borderRadius: '30px' }}>
                                                            <FaUpload /> {isUploading ? "Subiendo..." : "Subir Foto"}
                                                        </label>
                                                    </div>
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                        <h2>Directorio de Chefs</h2>
                                        <button className={styles.primaryBtn} onClick={() => setEditingChef({})}><FaPlus /> Nuevo Chef</button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
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
                                                        <tr key={chef.id} style={{ background: editingChef?.id === chef.id ? '#f0f7ff' : 'transparent' }}>
                                                            <td>
                                                                <div style={{ fontWeight: 700 }}>{chef.nombre}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>{chef.restaurante_principal}</div>
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
                                                        value={editingChef.nombre || ''} 
                                                        onChange={e => setEditingChef({...editingChef, nombre: e.target.value})}
                                                    />

                                                    <label>Restaurante Principal</label>
                                                    <input 
                                                        value={editingChef.restaurante_principal || ''} 
                                                        onChange={e => setEditingChef({...editingChef, restaurante_principal: e.target.value})}
                                                    />

                                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label>Ubicación</label>
                                                            <input 
                                                                value={editingChef.ubicacion || ''} 
                                                                onChange={e => setEditingChef({...editingChef, ubicacion: e.target.value})}
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
                                                        value={editingChef.biografia_corta || ''} 
                                                        onChange={e => setEditingChef({...editingChef, biografia_corta: e.target.value})}
                                                        rows={3}
                                                    />

                                                    <label>Logro Clave</label>
                                                    <input 
                                                        value={editingChef.logro_clave || ''} 
                                                        onChange={e => setEditingChef({...editingChef, logro_clave: e.target.value})}
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
