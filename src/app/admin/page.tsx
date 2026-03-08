"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import styles from "./admin.module.css";
import { FaChartBar, FaUtensils, FaUsers, FaStar, FaShieldAlt, FaTrash, FaEdit } from 'react-icons/fa';

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [leads, setLeads] = useState<any[]>([]);
    const [stats, setStats] = useState({ restaurants: 100, chefs: 4, users: 240 });

    // Simple security check: Only allow specific user or check for a custom claim/role in production
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

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

    if (loading) return <div className={styles.loading}>Cargando Panel...</div>;

    return (
        <div className={styles.adminWrapper}>
            <aside className={styles.sidebar}>
                <div className={styles.adminLogo}>
                    <FaShieldAlt /> <span>Admin Panel</span>
                </div>
                <nav className={styles.nav}>
                    <button className={styles.navItemActive}><FaChartBar /> Dashboard</button>
                    <button className={styles.navItem}><FaUtensils /> Restaurantes</button>
                    <button className={styles.navItem}><FaUsers /> Chefs</button>
                    <button className={styles.navItem}><FaStar /> Reseñas</button>
                </nav>
            </aside>

            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <h1>Resumen de la Plataforma</h1>
                    <div className={styles.userTag}>{user?.email}</div>
                </header>

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
                    <h2>Prospectos de Negocio Recientes (Firestore)</h2>
                    <table className={styles.adminTable}>
                        <thead>
                            <tr>
                                <th>Restaurante</th>
                                <th>Categoría</th>
                                <th>Subdominio</th>
                                <th>Email</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.length > 0 ? (
                                leads.map((lead) => (
                                    <tr key={lead.id}>
                                        <td>{lead.restaurantName}</td>
                                        <td>{lead.category}</td>
                                        <td><span className={styles.subdomainTag}>{lead.subdomain}</span></td>
                                        <td>{lead.email}</td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button className={styles.editBtn}><FaEdit /></button>
                                                <button className={styles.deleteBtn}><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No hay prospectos registrados aún.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
            </main>
        </div>
    );
}
