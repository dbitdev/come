// Required for static export (Firebase Hosting)
export function generateStaticParams() {
    return [
        { slug: ['con-estrellas'] },
        { slug: ['chefs'] },
        { slug: ['recetas'] },
        { slug: ['mexico'] },
    ];
}

export default function Guias({ params }: { params: { slug: string[] } }) {
    return (
        <div style={{ paddingTop: '100px', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <h1>Guía: Próximamente</h1>
        </div>
    );
}
