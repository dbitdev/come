// Los códigos de Firebase Storage son la única pista útil cuando falla una
// subida; un "Error al subir el archivo" a secas obliga a abrir la consola.
export function mensajeDeError(error: unknown): string {
    const codigo = (error as { code?: string })?.code ?? "";
    if (codigo === "storage/unauthorized")
        return "Storage rechazó la subida (storage/unauthorized). Revisa que hayas entrado con una cuenta de la redacción y que las reglas de Storage estén desplegadas.";
    if (codigo === "storage/quota-exceeded")
        return "Se acabó la cuota de Firebase Storage (storage/quota-exceeded).";
    if (codigo === "storage/unauthenticated")
        return "Tu sesión caducó (storage/unauthenticated). Vuelve a entrar e inténtalo de nuevo.";
    if (codigo === "storage/retry-limit-exceeded")
        return "La subida tardó demasiado (storage/retry-limit-exceeded). Revisa tu conexión o prueba con un archivo más ligero.";
    if (codigo === "storage/canceled") return "Subida cancelada.";
    return `Error al subir el archivo${codigo ? ` (${codigo})` : ""}.`;
}
