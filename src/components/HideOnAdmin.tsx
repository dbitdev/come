"use client";

import { usePathname } from "next/navigation";

/**
 * Oculta su contenido dentro del panel de administración. El admin trae su
 * propia barra lateral, así que el Navbar y el Footer del sitio sobran ahí.
 */
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (pathname?.startsWith("/admin")) return null;
    return <>{children}</>;
}
