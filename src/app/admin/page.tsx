"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from '@/lib/firebase';
import AdminGuard from "@/components/AdminGuard";
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";
import styles from "./admin.module.css";
import { FaChartBar, FaUtensils, FaUsers, FaStar, FaShieldAlt, FaTrash, FaEdit, FaPlus, FaBookOpen, FaConciergeBell } from 'react-icons/fa';

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const [activeSection, setActiveSection] = useState<'dashboard' | 'restaurantes' | 'chefs' | 'menus' | 'platillos'>('dashboard');
    const [leads, setLeads] = useState<any[]>([]);
    const [stats, setStats] = useState({ restaurants: 100, chefs: 4, users: 240 });

    // Forms States
    const [newChef, setNewChef] = useState({ name: '', specialty: '', experience: '', bio: '' });
    const [newRestaurant, setNewRestaurant] = useState({ name: '', type: '', location: '', description: '' });

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const q = query(collection(db, "business_leads"), orderBy("createdAt", "desc"), limit(5));
                const querySnapshot = await getDocs(q);
                const leadsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLeads(leadsData);
            } catch (err) {
                console.error("Error fetching leads:", err);
            }
        };

        if (user) fetchLeads();
    }, [user]);

    const handleCreateChef = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "Chefs"), { ...newChef, createdAt: serverTimestamp() });
            alert("Chef registrado con éxito");
            setNewChef({ name: '', specialty: '', experience: '', bio: '' });
        } catch (err) { console.error(err); }
    };

    const handleCreateRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "Restaurantes"), { ...newRestaurant, createdAt: serverTimestamp() });
            alert("Restaurante registrado con éxito");
            setNewRestaurant({ name: '', type: '', location: '', description: '' });
        } catch (err) { console.error(err); }
    };

    return (
        <AdminGuard>
            <div className={styles.adminWrapper}>
                <aside className={styles.sidebar}>
                    <div className={styles.adminLogo}>
                        <FaShieldAlt /> <span>Admin Panel</span>
                    </div>
                    <nav className={styles.nav}>
                        <button onClick={() => setActiveSection('dashboard')} className={activeSection === 'dashboard' ? styles.navItemActive : styles.navItem}><FaChartBar /> Dashboard</button>
                        <button onClick={() => setActiveSection('restaurantes')} className={activeSection === 'restaurantes' ? styles.navItemActive : styles.navItem}><FaUtensils /> Restaurantes</button>
                        <button onClick={() => setActiveSection('chefs')} className={activeSection === 'chefs' ? styles.navItemActive : styles.navItem}><FaUsers /> Chefs</button>
                        <button onClick={() => setActiveSection('menus')} className={activeSection === 'menus' ? styles.navItemActive : styles.navItem}><FaBookOpen /> Menús</button>
                        <button onClick={() => setActiveSection('platillos')} className={activeSection === 'platillos' ? styles.navItemActive : styles.navItem}><FaConciergeBell /> Platillos</button>
                    </nav>
                </aside>

                <main className={styles.mainContent}>
                    <header className={styles.header}>
                        <h1>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
                        <div className={styles.userTag}>{user?.email}</div>
                    </header>

                    {activeSection === 'dashboard' && (
                        <>
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <h3>Total Restaurantes</h3>
                                    <p>{stats.restaurants}</p>
                                </div>
                                <div className={styles.statCard}>
                                    <h3>Chefs Destacados</h3>
                                    <p>{stats.chefs}</p>
                                </div>
                                <div className={styles.statCard}>
                                    <h3>Nuevos Usuarios</h3>
                                    <p>{stats.users}</p>
                                </div>
                            </div>
                            <section className={styles.tableSection}>
                                <h2>Prospectos de Negocio Recientes</h2>
                                <table className={styles.adminTable}>
                                    <thead>
                                        <tr>
                                            <th>Restaurante</th>
                                            <th>Subdominio</th>
                                            <th>Email</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leads.map((lead) => (
                                            <tr key={lead.id}>
                                                <td>{lead.restaurantName}</td>
                                                <td><span className={styles.subdomainTag}>{lead.subdomain}</span></td>
                                                <td>{lead.email}</td>
                                                <td>
                                                    <div className={styles.actions}>
                                                        <button className={styles.editBtn}><FaEdit /></button>
                                                        <button className={styles.deleteBtn}><FaTrash /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>
                        </>
                    )}

                    {activeSection === 'chefs' && (
                        <section className={styles.formSection}>
                            <h2>Registrar Nuevo Chef</h2>
                            <form onSubmit={handleCreateChef} className={styles.adminForm}>
                                <input placeholder="Nombre Completo" value={newChef.name} onChange={e => setNewChef({...newChef, name: e.target.value})} />
                                <input placeholder="Especialidad (Ej. Cocina Oaxaqueña)" value={newChef.specialty} onChange={e => setNewChef({...newChef, specialty: e.target.value})} />
                                <input placeholder="Años de Experiencia" type="number" value={newChef.experience} onChange={e => setNewChef({...newChef, experience: e.target.value})} />
                                <textarea placeholder="Biografía corta..." value={newChef.bio} onChange={e => setNewChef({...newChef, bio: e.target.value})} />
                                <button type="submit" className={styles.primaryBtn}><FaPlus /> Guardar Chef</button>
                            </form>
                        </section>
                    )}

                    {activeSection === 'restaurantes' && (
                        <section className={styles.formSection}>
                            <h2>Agregar Restaurante Corporativo</h2>
                            <form onSubmit={handleCreateRestaurant} className={styles.adminForm}>
                                <input placeholder="Nombre del Establecimiento" value={newRestaurant.name} onChange={e => setNewRestaurant({...newRestaurant, name: e.target.value})} />
                                <input placeholder="Tipo de Cocina" value={newRestaurant.type} onChange={e => setNewRestaurant({...newRestaurant, type: e.target.value})} />
                                <input placeholder="Ubicación (Ciudad/Zona)" value={newRestaurant.location} onChange={e => setNewRestaurant({...newRestaurant, location: e.target.value})} />
                                <textarea placeholder="Descripción del lugar..." value={newRestaurant.description} onChange={e => setNewRestaurant({...newRestaurant, description: e.target.value})} />
                                <button type="submit" className={styles.primaryBtn}><FaPlus /> Registrar Restaurante</button>
                            </form>
                        </section>
                    )}
                    
                    {(activeSection === 'menus' || activeSection === 'platillos') && (
                        <div className={styles.emptyState}>
                            <FaBookOpen size={48} color="#ddd" />
                            <p>Esta sección está conectada a la base de datos central. Pronto podrás gestionar Menús y Platillos individuales aquí.</p>
                        </div>
                    )}
                </main>
            </div>
        </AdminGuard>
    );
}
