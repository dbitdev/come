"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaSearch, FaUser, FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import styles from "./Navbar.module.css";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/";
  };

  const isHome = pathname === "/";
  const isSolid = scrolled || !isHome;

  return (
    <header className={`${styles.header} ${isSolid ? styles.scrolled : ""} ${isMenuOpen ? styles.menuOpen : ""}`}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            <img src="/come.png" alt="Come Logo" className={styles.logoImage} />
          </Link>
        </div>

        {/* Search - Central Element */}
        <div className={styles.searchContainer}>
          <div className={styles.searchBar}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar restaurantes, cocina..."
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  window.location.href = `/lugares?search=${encodeURIComponent(mobileSearch)}`;
                }
              }}
            />
          </div>
        </div>

        <nav className={`${styles.nav} ${isMenuOpen ? styles.navActive : ""}`}>
          <Link href="/lugares" onClick={() => setIsMenuOpen(false)}>Lugares</Link>
          <Link href="/mapa" onClick={() => setIsMenuOpen(false)}>Mapa</Link>
          <div className={styles.dropdown}>
            <button className={styles.dropbtn}>Guías</button>
            <div className={styles.dropdownContent}>
              <Link href="/guias/con-estrellas" onClick={() => setIsMenuOpen(false)}>Con Estrellas</Link>
              <Link href="/guias/chefs" onClick={() => setIsMenuOpen(false)}>Chefs</Link>
              <Link href="/nomina-chef" onClick={() => setIsMenuOpen(false)}>Nominar Chef</Link>
              <Link href="/guias/recetas" onClick={() => setIsMenuOpen(false)}>Recetas</Link>
            </div>
          </div>

          <Link href="https://mexicatv.com/gourmet/" onClick={() => setIsMenuOpen(false)}>Mexica Gourmet</Link>
        </nav>

        <div className={styles.actions}>
          {user ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link href="/perfil" className={styles.userAction} title="Ver Perfil">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                ) : (
                  <FaUser />
                )}
              </Link>
              <button onClick={handleLogout} className={styles.userAction} title="Cerrar Sesión" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <FaSignOutAlt />
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.userAction} title="Iniciar Sesión">
              <FaUser />
            </Link>
          )}
          <button className={styles.hamburger} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </header>
  );
}
