"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { leerRolDeUsuario } from "@/lib/roles";

// Correos de arranque: siempre admin. El resto entra por el rol de su ficha
// (admin o curador), que sólo un admin puede otorgar.
const ADMIN_EMAILS = ['dbitdev@gmail.com', 'admin@come.mx', 'parradabito@gmail.com'];

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.push('/login');
            return;
        }
        let vivo = true;

        // Lee el rol de la ficha con reintentos: en el primer render el canal de
        // Firestore puede no tener aún el token, y un getDoc suelto se queda
        // colgado (curador atorado en "Verificando…") o rebota por un
        // permiso transitorio. Reintentar en cuanto el canal está listo lo
        // resuelve; el admin por correo ni siquiera llega aquí.
        (async () => {
            let ok = ADMIN_EMAILS.includes(user.email || '');
            if (!ok && db) {
                const rol = await leerRolDeUsuario(db, user.uid);
                ok = rol === 'admin' || rol === 'curator';
            }
            if (!vivo) return;
            if (ok) setAuthorized(true);
            else router.push('/');
        })();
        return () => { vivo = false; };
        // `router` se excluye a propósito: este Next puede devolver una instancia
        // nueva en cada render y, con el guard `vivo`, el efecto se cancelaría a sí
        // mismo antes de resolver — el curador quedaría atorado en "Verificando…".
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, loading]);

    if (loading || !authorized) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#666' }}>
                Verificando credenciales…
            </div>
        );
    }

    return <>{children}</>;
}
