import React from "react";
import Link from "next/link";
import styles from "./Footer.module.css";
import { Globe, Mail, Award, ExternalLink } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            {/* Instagram Promo Section */}
            <div className={styles.instaPromo}>
                <span className="mag-label">Comunidad</span>
                <h2 className={styles.instaTitle}>Síguenos <span>@come_mx</span></h2>
                <div className={styles.instaGrid}>
                    <div className={styles.instaImg} style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400)' }}>
                       <span className={styles.instaTag}>#Gourmet</span>
                    </div>
                    <div className={styles.instaImg} style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1543332164-6e82f355514f?q=80&w=400)' }}>
                       <span className={styles.instaTag}>#Recetas</span>
                    </div>
                    <div className={styles.instaImg} style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400)' }}>
                       <span className={styles.instaTag}>#Lugares</span>
                    </div>
                    <div className={styles.instaImg} style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=400)' }}>
                       <span className={styles.instaTag}>#México</span>
                    </div>
                </div>
            </div>

            {/* Subscribe Banner */}
            <div className={styles.subscribeBanner}>
                <div className={styles.subTitle}>
                    <Mail size={24} />
                    <span>Mantente al tanto de cada sabor</span>
                </div>
                <div className={styles.subForm}>
                    <input type="email" placeholder="Tu correo electrónico" className={styles.subInput} />
                    <button className={styles.subBtn}>Suscribirse</button>
                </div>
            </div>

            <div className={styles.container}>
                <div className={styles.megaGrid}>
                    <div className={styles.column}>
                        <h3>Recetas</h3>
                        <Link href="/guias/recetas">Desayunos</Link>
                        <Link href="/guias/recetas">Comidas</Link>
                        <Link href="/guias/recetas">Cenas</Link>
                        <Link href="/guias/recetas">Postres</Link>
                    </div>
                    <div className={styles.column}>
                        <h3>Blog</h3>
                        <Link href="/noticias">Tendencias</Link>
                        <Link href="/noticias">Entrevistas</Link>
                        <Link href="/noticias">Crónicas</Link>
                        <Link href="/noticias">Editorial</Link>
                    </div>
                    <div className={styles.column}>
                        <h3>Lugares</h3>
                        <Link href="/lugares">Explorar</Link>
                        <Link href="/lugares/con-estrellas">Michelin</Link>
                        <Link href="/mapa">Mapa</Link>
                        <Link href="/mexica-gourmet">Mexica</Link>
                    </div>
                    <div className={styles.column}>
                        <h3>Partner</h3>
                        <Link href="/nomina-chef">Postula Chef</Link>
                        <Link href="/nomina-chef">Postula Lugar</Link>
                        <Link href="/login">Acceso</Link>
                    </div>
                    <div className={styles.column}>
                        <h3>Legal</h3>
                        <Link href="/terminos">Términos</Link>
                        <Link href="/privacidad">Privacidad</Link>
                        <Link href="/cookies">Cookies</Link>
                    </div>
                    <div className={styles.column}>
                        <h3>Contacto</h3>
                        <Link href="/contacto">Escríbenos</Link>
                        <Link href="/nosotros">Acerca</Link>
                        <div className={styles.brandLogo}>
                            <div className={styles.brandText}>Come.</div>
                        </div>
                    </div>
                </div>

                <div className={styles.bottomSection}>
                    <p>&copy; {new Date().getFullYear()} Come. La Guía Gastronómica. Todos los derechos reservados.</p>
                    <p className={styles.poweredBy}>
                        Creatividad con Alma Mexicana
                    </p>
                </div>
            </div>
        </footer>
    );
}
