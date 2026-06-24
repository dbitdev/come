import Link from 'next/link';

export default function Empleos() {
    return (
        <div style={{ paddingTop: '160px', paddingBottom: '100px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', backgroundColor: '#f9f9f9', padding: '0 2rem' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', color: '#111' }}>Trabaja con Nosotros</h1>
            <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '600px', marginBottom: '3rem', lineHeight: 1.6 }}>
                Estamos buscando a los mejores talentos del mundo gastronómico y tecnológico para revolucionar la industria en México.
            </p>
            <div style={{ background: '#fff', padding: '3rem', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', maxWidth: '500px', width: '100%' }}>
                <h3 style={{ marginBottom: '1rem' }}>No hay vacantes disponibles actualmente</h3>
                <p style={{ color: '#888', marginBottom: '2rem' }}>Síguenos en LinkedIn para enterarte de nuevas oportunidades.</p>
                <Link href="/" style={{ padding: '0.8rem 2rem', background: '#000', color: '#fff', textDecoration: 'none', fontWeight: 700, borderRadius: '6px' }}>Regresar al Home</Link>
            </div>
        </div>
    );
}
