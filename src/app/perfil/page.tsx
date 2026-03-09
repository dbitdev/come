"use client";

import React from 'react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./profile.module.css";
import { FaUserCircle, FaEnvelope, FaCalendarAlt, FaStar, FaSignOutAlt, FaPlusCircle } from 'react-icons/fa';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function UserProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const [userBusinesses, setUserBusinesses] = useState<any[]>([]);
    const [fetchingBusinesses, setFetchingBusinesses] = useState(true);

    useEffect(() => {
        const fetchBusinesses = async () => {
            if (user && db) {
                try {
                    const q = query(collection(db, "business_leads"), where("userId", "==", user.uid));
                    const querySnapshot = await getDocs(q);
                    const businesses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setUserBusinesses(businesses);
                } catch (error) {
                    console.error("Error fetching businesses:", error);
                } finally {
                    setFetchingBusinesses(false);
                }
            }
        };

        if (!loading && user) {
            fetchBusinesses();
        }
    }, [user, loading]);

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/');
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <div className={styles.sidebar}>
                    <div className={styles.profileHeader}>
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className={styles.avatar} />
                        ) : (
                            <FaUserCircle className={styles.avatarPlaceholder} />
                        )}
                        <h2 className={styles.name}>{user.displayName || "Gourmet"}</h2>
                        <span className={styles.badge}>Miembro Gold</span>
                    </div>

                    <nav className={styles.sideNav}>
                        <button className={styles.navItemActive}><FaUserCircle /> Mi Cuenta</button>
                        <button className={styles.navItem}><FaStar /> Favoritos</button>
                        <Link href="/registra-negocio" className={styles.navItem} style={{ textDecoration: 'none' }}>
                            <FaPlusCircle /> Registrar Negocio
                        </Link>
                        <button onClick={handleLogout} className={styles.logoutBtn}><FaSignOutAlt /> Cerrar Sesión</button>
                    </nav>
                </div>

                <main className={styles.content}>
                    <section className={styles.section}>
                        <h1 className={styles.sectionTitle}>Información Personal</h1>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoCard}>
                                <label><FaEnvelope /> Email</label>
                                <p>{user.email}</p>
                            </div>
                            <div className={styles.infoCard}>
                                <label><FaCalendarAlt /> Fecha de Registro</label>
                                <p>{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Reciente"}</p>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Tus Negocios Registrados</h2>
                        {fetchingBusinesses ? (
                            <p>Cargando tus negocios...</p>
                        ) : userBusinesses.length > 0 ? (
                            <div className={styles.businessGrid}>
                                {userBusinesses.map(biz => (
                                    <div key={biz.id} className={styles.businessCard}>
                                        <h3>{biz.restaurantName}</h3>
                                        <p className={styles.bizCategory}>{biz.category}</p>
                                        <p className={styles.bizSubdomain}>
                                            <a href={`https://${biz.subdomain}`} target="_blank" rel="noopener noreferrer">
                                                {biz.subdomain}
                                            </a>
                                        </p>
                                        <div className={styles.bizActions}>
                                            <Link href={`/gestiona-negocio/${biz.id}`} className={styles.editBtn}>
                                                Gestionar Menú
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <FaPlusCircle className={styles.emptyIcon} />
                                <p>Aún no has registrado ningún negocio.</p>
                                <Link href="/registra-negocio" className={styles.exploreBtn}>Registrar ahora</Link>
                            </div>
                        )}
                    </section>

                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Tus Restaurantes Favoritos</h2>
                        <div className={styles.emptyState}>
                            <FaStar className={styles.emptyIcon} />
                            <p>Aún no has guardado ningún restaurante.</p>
                            <Link href="/lugares" className={styles.exploreBtn}>Explorar Lugares</Link>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
