import React from 'react';
import Link from 'next/link';
import { Heart, Sparkles, Users, Globe, Award, Rocket, ChevronRight } from 'lucide-react';
import styles from './nosotros.module.css';

export default function Nosotros() {
    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <img 
                    src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80" 
                    alt="Gastronomía Mexicana" 
                    className={styles.heroImage} 
                />
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                    <h1>Nuestra Pasión por el Sabor</h1>
                    <p>Elevando la gastronomía mexicana a un nivel global, conectando corazones a través de la mesa.</p>
                </div>
            </section>

            {/* Story Section */}
            <section className={styles.section}>
                <div className={styles.storyGrid}>
                    <div className={styles.storyText}>
                        <h2>Nuestra Historia</h2>
                        <p>
                            Come nació de un deseo profundo de celebrar y preservar la riqueza culinaria de México. En un país donde cada platillo cuenta una historia, sentimos la necesidad de crear un puente digital que conectara a los amantes de la buena mesa con los tesoros escondidos de nuestras ciudades.
                        </p>
                        <p>
                            Desde las fondas más tradicionales hasta los restaurantes con estrellas Michelin, nuestra misión es dar visibilidad a la excelencia, la técnica y, sobre todo, al alma que los chefs ponen en cada ingrediente.
                        </p>
                        <p>
                            Hoy, somos la guía gastronómica líder, impulsada por una comunidad que valora la autenticidad y la innovación.
                        </p>
                    </div>
                    <div className={styles.storyImageWrapper}>
                        <img 
                            src="https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1000&q=80" 
                            alt="Cocina en acción" 
                            className={styles.storyImage} 
                        />
                    </div>
                </div>
            </section>

            {/* Mission & Vision Section */}
            <section className={`${styles.section} ${styles.missionVision}`}>
                <div className={styles.mvGrid}>
                    <div className={styles.mvCard}>
                        <h3><Rocket size={32} /> Nuestra Misión</h3>
                        <p>
                            Facilitar el descubrimiento de experiencias gastronómicas inigualables, proporcionando herramientas digitales de vanguardia tanto para comensales como para dueños de negocios, fomentando un ecosistema culinario vibrante y sostenible.
                        </p>
                    </div>
                    <div className={styles.mvCard}>
                        <h3><Globe size={32} /> Nuestra Visión</h3>
                        <p>
                            Convertirnos en el referente mundial de la gastronomía mexicana, siendo la plataforma indispensable para proyectar el talento nacional y las tradiciones que nos definen ante los ojos del mundo.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className={styles.section}>
                <div className={styles.valuesSection}>
                    <h2>Nuestros Valores</h2>
                    <div className={styles.valuesGrid}>
                        <div className={styles.valueCard}>
                            <Heart className={styles.valueIcon} />
                            <h4>Pasión</h4>
                            <p>Amamos lo que hacemos y celebramos la entrega de quienes hacen posible la magia en la cocina.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <Award className={styles.valueIcon} />
                            <h4>Excelencia</h4>
                            <p>Buscamos y destacamos solo lo mejor, manteniendo estándares que inspiran confianza.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <Users className={styles.valueIcon} />
                            <h4>Comunidad</h4>
                            <p>Crecemos juntos, apoyando a los negocios locales y escuchando a nuestros usuarios.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <Sparkles className={styles.valueIcon} />
                            <h4>Innovación</h4>
                            <p>Utilizamos la tecnología para simplificar y enriquecer cada paso de la experiencia culinaria.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <div className={styles.ctaContent}>
                    <h2>Sé parte de nuestra mesa</h2>
                    <p>Ya sea que busques el próximo sabor que te enamore o quieras que el mundo conozca tu sazón, hay un lugar para ti en Come.</p>
                    <div className={styles.ctaButtons}>
                        <Link href="/lugares" className={styles.primaryBtn}>
                            Explorar Restaurantes
                        </Link>
                        <Link href="/nomina-chef" className={styles.secondaryBtn}>
                            Nominar un Lugar
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
