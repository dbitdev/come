import React from 'react';
import Link from 'next/link';
import styles from './Banner.module.css';

export default function Banner() {
    return (
        <section className={styles.banner}>
            <div className={styles.content}>
                <h2>¿Eres dueño de un restaurante?</h2>
                <p>
                    Únete a la red más grande de Latinoamérica. Registra tu negocio totalmente gratis y
                    genera un menú digital interactivo con subdominio personalizado al instante.
                </p>
                <Link href="/registra-negocio" className={styles.button}>
                    Registra tu negocio gratis
                </Link>
            </div>
        </section>
    );
}
