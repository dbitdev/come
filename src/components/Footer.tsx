import React from "react";
import Link from "next/link";
import styles from "./Footer.module.css";
import { Globe, Mail, Award, ExternalLink } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.megaGrid}>
                    <div className={styles.column}>
                        <h3>Descubre</h3>
                        <Link href="/lugares">Lugares Populares</Link>
                        <Link href="/lugares/con-estrellas">Estrellas Michelin</Link>
                        <Link href="/mapa">Mapa interactivo</Link>
                        <Link href="/mexica-gourmet">Mexica Gourmet</Link>
                    </div>
                    <div className={styles.column}>
                        <h3>Partners</h3>
                        <Link href="/nomina-chef">Nominar un lugar</Link>
                        <Link href="/nomina-chef">Nominar un Chef</Link>
                        <Link href="/login">Acceso Partners</Link>
                        <Link href="/publicidad">Publicidad</Link>
                    </div>
                    <div className={styles.column}>
                        <h3>Compañía</h3>
                        <Link href="/nosotros">Acerca de nosotros</Link>
                        <Link href="/empleos">Empleos</Link>
                        <Link href="/prensa">Prensa</Link>
                        <Link href="/contacto">Contacto</Link>
                    </div>
                    <div className={styles.column}>
                        <h3>Ayuda</h3>
                        <Link href="/faq">Preguntas Frecuentes</Link>
                        <Link href="/soporte">Centro de Soporte</Link>
                        <Link href="/reportar">Reportar Problema</Link>
                    </div>
                </div>

                <div className={styles.separator} />

                <div className={styles.socialBar}>
                    <a href="https://facebook.com" aria-label="Facebook"><FaFacebookF /></a>
                    <a href="https://instagram.com" aria-label="Instagram"><FaInstagram /></a>
                    <a href="https://twitter.com" aria-label="Twitter"><FaTwitter /></a>
                    <a href="https://youtube.com" aria-label="Youtube"><FaYoutube /></a>
                    <a href="https://linkedin.com" aria-label="LinkedIn"><FaLinkedinIn /></a>
                </div>

                <div className={styles.legalLinks}>
                    <Link href="/terminos">Términos y condiciones</Link>
                    <Link href="/privacidad">Política de Privacidad</Link>
                    <Link href="/cookies">Configuración de Cookies</Link>
                    <Link href="/accesibilidad">Accesibilidad</Link>
                </div>

                <div className={styles.bottomBar}>
                    <p>&copy; {new Date().getFullYear()} Mexica Medios y Entretenimiento S.A. de C.V. Todos los derechos reservados.</p>
                    <p className={styles.poweredBy}>
                        Powered by <a href="https://dotco.com.mx/" target="_blank" rel="noopener noreferrer">Dot</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
