import React from 'react';
import Link from 'next/link';
import styles from './Banner.module.css';

export default function Banner() {
    return (
        <section className={styles.banner}>
            <div className={styles.content}>
                <h2>¿Conoces un lugar extraordinario?</h2>
                <p>
                    La excelencia merece ser compartida. Nomina a ese chef o restaurante que todo mundo debería conocer en nuestro exclusivo club gastronómico.
                </p>
                <Link href="/nomina-lugar" className={styles.button}>
                    Nominar un Lugar
                </Link>
            </div>
        </section>
    );
}
