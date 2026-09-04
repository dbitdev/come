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
type UserBusiness = { id:string; restaurantName?:string; name?:string; category?:string };

export default function UserProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [userBusinesses, setUserBusinesses] = useState<UserBusiness[]>([]);
    const [fetchingBusinesses, setFetchingBusinesses] = useState(true);

    useEffect(() => {
        const fetchBusinesses = async () => {
            if (user && db) {
                try {
                    const q = query(collection(db, "come"), where("userId", "==", user.uid));
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

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [loading, user, router]);

    if (loading || !user) {
        return <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>;
    }

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
                        <span className={styles.badge}>Miembro Come</span>
                    </div>

                    <nav className={styles.sideNav}>
                        <button className={styles.navItemActive}><FaUserCircle /> Mi Cuenta</button>
                        <button className={styles.navItem}><FaStar /> Favoritos</button>
                        <Link href="/nomina-lugar" className={styles.navItem} style={{ textDecoration: 'none' }}>
                            <FaPlusCircle /> Nominar un Lugar
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
                        <h2 className={styles.sectionTitle}>Tus Restaurantes Favoritos</h2>
                        <div className={styles.emptyState}>
                            <FaStar className={styles.emptyIcon} />
                            <p>Aún no has guardado ningún restaurante.</p>
                            <Link href="/restaurantes" className={styles.exploreBtn}>Explorar restaurantes</Link>
                        </div>
                    </section>
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Tus negocios</h2>
                        {fetchingBusinesses ? <p>Cargando negocios…</p> : userBusinesses.length ? <div className={styles.businessGrid}>{userBusinesses.map((business)=><article className={styles.businessCard} key={business.id}><h3>{business.restaurantName || business.name}</h3><p className={styles.bizCategory}>{business.category || "Restaurante"}</p><div className={styles.bizActions}><Link className={styles.editBtn} href={`/gestiona-negocio/${business.id}`}>Gestionar</Link></div></article>)}</div> : <div className={styles.emptyState}><p>Aún no administras ningún establecimiento.</p><Link href="/registra-negocio" className={styles.exploreBtn}>Registrar negocio</Link></div>}
                    </section>
                </main>
            </div>
        </div>
    );
}
