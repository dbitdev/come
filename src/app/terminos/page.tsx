import Link from 'next/link';

export default function Terminos() {
    return (
        <div style={{ paddingTop: '160px', paddingBottom: '100px', minHeight: '100vh', maxWidth: '800px', margin: '0 auto', padding: '160px 2rem 100px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem' }}>Términos y Condiciones</h1>
            <div style={{ color: '#555', lineHeight: 1.8 }}>
                <p style={{ marginBottom: '1.5rem' }}>Última actualización: 8 de Marzo, 2026</p>
                <h2 style={{ color: '#000', margin: '2rem 0 1rem' }}>1. Uso del Sitio</h2>
                <p style={{ marginBottom: '1.5rem' }}>Al acceder a Come, aceptas cumplir con estos términos. El sitio es para uso informativo sobre la gastronomía mexicana.</p>
                <h2 style={{ color: '#000', margin: '2rem 0 1rem' }}>2. Propiedad Intelectual</h2>
                <p style={{ marginBottom: '1.5rem' }}>Todo el contenido, incluyendo la Guía de Chefs y la data de Lugares, es propiedad de Come o sus licenciantes.</p>
                <h2 style={{ color: '#000', margin: '2rem 0 1rem' }}>3. Contacto</h2>
                <p style={{ marginBottom: '1.5rem' }}>Para cualquier duda legal, contáctanos en legal@come.mx</p>
            </div>
            <Link href="/" style={{ display: 'inline-block', marginTop: '3rem', padding: '0.8rem 2rem', background: 'var(--primary)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Regresar al Inicio</Link>
        </div>
    );
}
