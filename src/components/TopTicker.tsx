import styles from './TopTicker.module.css';

const TICKER_ITEMS = [
    { num: "01", text: "Crónicas Gastronómicas de México" },
    { num: "02", text: "Nuevas Aperturas: CDMX y Monterrey" },
    { num: "03", text: "Entrevistas con Chefs de Vanguardia" },
    { num: "04", text: "Sabor Mexicano: De la Calle a la Mesa" },
    { num: "05", text: "Guías de Temporada: Lo Mejor de la Primavera" },
    { num: "06", text: "Gourmet & Tradición — Edición Especial" },
];

export default function TopTicker() {
    return (
        <div className={styles.tickerContainer}>
            <div className={styles.tickerLabel}>Breaking</div>
            <div className={styles.tickerWrapper}>
                <div className="animate-marquee">
                    {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
                        <div key={idx} className={styles.tickerItem}>
                            <span className={styles.tickerNum}>{item.num}</span>
                            {item.text}
                            <span style={{ opacity: 0.2, marginLeft: '1rem' }}>◆</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.tickerMeta}>
                <span>Primavera 2026</span>
                <span className={styles.sep}>|</span>
                <span>Come MX</span>
            </div>
        </div>
    );
}
