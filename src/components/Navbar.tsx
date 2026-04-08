"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, Menu, X, LogOut, ChevronDown } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import styles from "./Navbar.module.css";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGuiasOpen, setIsGuiasOpen] = useState(false);
  const [isMexicoOpen, setIsMexicoOpen] = useState(false);
  const [isMasOpen, setIsMasOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");
  const { user } = useAuth();
  const pathname = usePathname();
  const guiasRef = useRef<HTMLDivElement>(null);
  const mexicoRef = useRef<HTMLDivElement>(null);
  const masRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if we should show/hide based on scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false); // Scrolling down - Hide
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true); // Scrolling up - Show
      }
      
      setScrolled(currentScrollY > 50);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    
    // Close search overlay on escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    // Close dropdowns on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (guiasRef.current && !guiasRef.current.contains(event.target as Node)) {
        setIsGuiasOpen(false);
      }
      if (mexicoRef.current && !mexicoRef.current.contains(event.target as Node)) {
        setIsMexicoOpen(false);
      }
      if (masRef.current && !masRef.current.contains(event.target as Node)) {
        setIsMasOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Prevent scroll when search overlay OR mobile menu is open
  useEffect(() => {
    if (isSearchOpen || isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isSearchOpen, isMenuOpen]);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/";
  };

  const isActive = (path: string) => pathname === path;
  const isMexicoActive = pathname.startsWith('/mexico');
  const isGuiasActive = pathname.startsWith('/guias') || pathname === '/nomina-chef';

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsGuiasOpen(false);
    setIsMexicoOpen(false);
    setIsMasOpen(false);
  };

  return (
    <header className={`${styles.header} ${isMenuOpen ? styles.menuOpen : ""} ${!isVisible ? styles.navHidden : ""}`}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/" onClick={closeAllMenus}>
            <img src="/come.png" alt="Come Logo" className={styles.logoImage} />
          </Link>
        </div>


        <nav className={`${styles.nav} ${isMenuOpen ? styles.navActive : ""}`}>
          <Link 
            href="/" 
            onClick={closeAllMenus}
            className={isActive('/') ? styles.active : ""}
          >
            Inicio
          </Link>
          <div 
            ref={mexicoRef} 
            className={`${styles.dropdown} ${isMexicoOpen ? styles.dropdownActive : ""} ${isActive('/lugares') ? styles.active : ""}`}
          >
            <button 
              className={`${styles.dropbtn} ${isActive('/lugares') ? styles.activeText : ""}`} 
              onClick={(e) => {
                e.preventDefault();
                setIsMexicoOpen(!isMexicoOpen);
                setIsGuiasOpen(false);
                setIsMasOpen(false);
              }}
            >
              Lugares
              <ChevronDown size={14} className={`${styles.chevron} ${isMexicoOpen ? styles.chevronRotated : ""}`} />
            </button>
            <div className={styles.dropdownContent}>
              <Link href="/lugares" onClick={closeAllMenus}>Explorar Lugares</Link>
              <Link href="/lugares/con-estrellas" onClick={closeAllMenus}>Con Estrellas</Link>
            </div>
          </div>

          <Link 
            href="/chefs" 
            onClick={closeAllMenus}
            className={isActive('/chefs') ? styles.active : ""}
          >
            Chefs
          </Link>

          <Link 
            href="/mapa" 
            onClick={closeAllMenus}
            className={isActive('/mapa') ? styles.active : ""}
          >
            Mapa
          </Link>
          
          <div 
            ref={guiasRef}
            className={`${styles.dropdown} ${isGuiasOpen ? styles.dropdownActive : ""} ${isGuiasActive ? styles.active : ""}`}
          >
            <button 
              className={`${styles.dropbtn} ${isGuiasActive ? styles.activeText : ""}`} 
              onClick={(e) => {
                e.preventDefault();
                setIsGuiasOpen(!isGuiasOpen);
                setIsMexicoOpen(false);
                setIsMasOpen(false);
              }}
            >
              Guías
              <ChevronDown size={14} className={`${styles.chevron} ${isGuiasOpen ? styles.chevronRotated : ""}`} />
            </button>
            <div className={styles.dropdownContent}>
              <Link href="/guias" onClick={closeAllMenus}>Explorar Guías</Link>
              <Link href="/guias/mexico/cultura" onClick={closeAllMenus}>Cultura</Link>
              <Link href="/guias/mexico/tradiciones" onClick={closeAllMenus}>Tradiciones</Link>
              <Link href="/guias/mexico/cocina-tradicional" onClick={closeAllMenus}>Cocina Tradicional</Link>
              <Link href="/guias/mexico/experiencias" onClick={closeAllMenus}>Experiencias</Link>
            </div>
          </div>

          <div 
            ref={masRef}
            className={`${styles.dropdown} ${isMasOpen ? styles.dropdownActive : ""}`}
          >
            <button 
              className={`${styles.dropbtn}`} 
              onClick={(e) => { 
                e.preventDefault(); 
                setIsMasOpen(!isMasOpen);
                setIsMexicoOpen(false);
                setIsGuiasOpen(false);
              }}
            >
              Más
              <ChevronDown size={14} className={`${styles.chevron} ${isMasOpen ? styles.chevronRotated : ""}`} />
            </button>
            <div className={styles.dropdownContent}>
              <Link href="/guias/recetas" onClick={closeAllMenus}>Recetas</Link>
              <Link href="/acerca" onClick={closeAllMenus}>Acerca de Come</Link>
              <Link href="/contacto" onClick={closeAllMenus}>Contacto</Link>
            </div>
          </div>

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
