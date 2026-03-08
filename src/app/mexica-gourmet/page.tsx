import Link from 'next/link';

export default function MexicaGourmet() {
    return (
        <div style={{ paddingTop: '160px', paddingBottom: '100px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', backgroundColor: '#000', color: '#fff' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '2rem' }}>Mexica TV presenta</span>
            <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '2rem', maxWidth: '800px', lineHeight: 1 }}>La Nueva Era de la Gastronomía Mexicana</h1>
            <p style={{ fontSize: '1.2rem', color: '#888', maxWidth: '600px', marginBottom: '3rem' }}>
                Estamos cocinando una experiencia multimedia sin precedentes. Series originales, documentales y contenido exclusivo para los amantes del buen comer.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Link href="/" style={{ padding: '1rem 2rem', background: 'var(--primary)', color: '#fff', textDecoration: 'none', fontWeight: 800 }}>Regresar al Inicio</Link>
                <button style={{ padding: '1rem 2rem', background: 'transparent', border: '2px solid #fff', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Ser el primero en saber</button>
            </div>
        </div>
    );
}
