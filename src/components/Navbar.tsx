"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, Menu, X, LogOut } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import styles from "./Navbar.module.css";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGuiasOpen, setIsGuiasOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Close search overlay on escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Prevent scroll when search overlay is open
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isSearchOpen]);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className={`${styles.header} ${isMenuOpen ? styles.menuOpen : ""}`}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            <img src="/come.png" alt="Come Logo" className={styles.logoImage} />
          </Link>
        </div>


        <nav className={`${styles.nav} ${isMenuOpen ? styles.navActive : ""}`}>
          <Link href="/" onClick={() => { setIsMenuOpen(false); setIsGuiasOpen(false); }}>Inicio</Link>
          <Link href="/lugares" onClick={() => { setIsMenuOpen(false); setIsGuiasOpen(false); }}>Lugares</Link>
          <Link href="/mapa" onClick={() => { setIsMenuOpen(false); setIsGuiasOpen(false); }}>Mapa</Link>
          <div className={`${styles.dropdown} ${isGuiasOpen ? styles.dropdownMobileActive : ""}`}>
            <button 
              className={styles.dropbtn} 
              onClick={(e) => {
                if (window.innerWidth <= 768) {
                  e.preventDefault();
                  setIsGuiasOpen(!isGuiasOpen);
                }
              }}
            >
              Guías
            </button>
            <div className={styles.dropdownContent}>
              <Link href="/guias/con-estrellas" onClick={() => setIsMenuOpen(false)}>Con Estrellas</Link>
              <Link href="/guias/chefs" onClick={() => setIsMenuOpen(false)}>Chefs</Link>
              <Link href="/nomina-chef" onClick={() => setIsMenuOpen(false)}>Nominar Lugar/Chef</Link>
              <Link href="/guias/recetas" onClick={() => setIsMenuOpen(false)}>Recetas</Link>
            </div>
          </div>

          <Link href="https://mexicatv.com/gourmet/" onClick={() => { setIsMenuOpen(false); setIsGuiasOpen(false); }}>Mexica Gourmet</Link>

          <div className={styles.navSocial}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebookF /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
          </div>
        </nav>

        <div className={styles.actions}>
          {/* Search Icon - Integrated into actions group */}
          <button 
            className={styles.searchIconBtn} 
            onClick={() => setIsSearchOpen(true)}
            aria-label="Buscar"
            style={{ marginRight: '0.5rem' }}
          >
            <Search size={20} strokeWidth={1.5} />
          </button>

          {user ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link href="/perfil" className={styles.userAction} title="Ver Perfil">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                ) : (
                  <User size={20} strokeWidth={1.5} />
                )}
              </Link>
              <button onClick={handleLogout} className={styles.userAction} title="Cerrar Sesión" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <LogOut size={20} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.userAction} title="Iniciar Sesión">
              <User size={20} strokeWidth={1.5} />
            </Link>
          )}
          <button className={styles.hamburger} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Full Screen Search Overlay */}
      {isSearchOpen && (
        <div className={styles.searchOverlay}>
          <button 
            className={styles.closeOverlay} 
            onClick={() => setIsSearchOpen(false)}
          >
            <X size={32} strokeWidth={1} />
          </button>
          <div className={styles.overlayContent}>
            <div className={styles.overlayInputGroup}>
              <Search className={styles.overlaySearchIcon} size={28} strokeWidth={1.5} />
              <input
                autoFocus
                type="text"
                placeholder="¿Qué estás buscando?"
                className={styles.overlayInput}
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    window.location.href = `/lugares?search=${encodeURIComponent(mobileSearch)}`;
                    setIsSearchOpen(false);
                  }
                }}
              />
            </div>
            <p className={styles.overlayHint}>Escribe y presiona Enter para buscar restaurantes o artículos</p>
          </div>
        </div>
      )}
    </header>
  );
}
