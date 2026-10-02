"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { auth, db } from '@/lib/firebase';
import AdminGuard from "@/components/AdminGuard";
import MediaUploader from "@/components/MediaUploader";
import SocialConnections from "@/components/SocialConnections";
import ImageImporter from "@/components/ImageImporter";
import { mensajeDeError } from "@/lib/erroresStorage";
import { lugaresQueMencionan, normalizar, separarNombres, textoDeChefs } from "@/lib/vinculos";
import { slugify } from '@/lib/utils';
import { leerRolDeUsuario } from "@/lib/roles";
import { 
    collection,
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    addDoc,
    arrayUnion,
    serverTimestamp,
    setDoc
} from "firebase/firestore";
import styles from "./admin.module.css";
import { 
    FaChartBar, FaUtensils, FaUsers, FaStar, FaShieldAlt, 
    FaTrash, FaEdit, FaPlus, FaBookOpen, FaConciergeBell, 
    FaSync, FaSave, FaTimes, FaImage, FaMapMarkerAlt, FaUpload,
    FaUserShield, FaExternalLinkAlt, FaAngleLeft, FaAngleRight, FaBars, FaCalendarAlt
} from 'react-icons/fa';
import PanelReservas from "@/components/reservas/PanelReservas";
import Link from "next/link";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const TITULOS: Record<string, string> = {
    dashboard: "Resumen",
    restaurantes: "Negocios y lugares",
    chefs: "Directorio de chefs",
    guias: "Guías interactivas",
    nominaciones: "Nominaciones por revisar",
    reclamaciones: "Reclamaciones de perfiles",
    usuarios: "Usuarios y roles",
    reservas: "Reservaciones",
};

/**
 * Asigna un negocio o una ficha a una persona registrada. El dueño puede luego
 * editarlo desde su perfil, así que esto lo decide sólo la redacción.
 */
type PlatilloEditable = { name: string; description?: string; price: number; section?: string };

/**
 * Carga de la carta de un negocio, dentro de su propio editor.
 *
 * El lugar aporta su PDF o la dirección de su carta y el sistema propone los
 * platillos; nada se guarda hasta que alguien los revisa. El parser es de
 * reglas, así que con cartas maquetadas a columnas o hechas de imágenes va a
 * fallar, y por eso avisa en vez de publicar cualquier cosa.
 */
function GestorDeMenu({
    lugarId,
    menu,
    onChange,
}: {
    lugarId?: string;
    menu: PlatilloEditable[];
    onChange: (siguiente: PlatilloEditable[]) => void;
}) {
    const [fuente, setFuente] = useState("");
    const [leyendo, setLeyendo] = useState(false);
    const [subiendo, setSubiendo] = useState(false);
    const [aviso, setAviso] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const leerDesde = async (url: string) => {
        setLeyendo(true); setError(null); setAviso(null);
        try {
            const token = await auth?.currentUser?.getIdToken();
            const respuesta = await fetch("/api/menu/extraer", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ url }),
            });
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos?.error || "No se pudo leer la carta.");
            if (datos.aviso) setAviso(datos.aviso);
            if (datos.platillos?.length) {
                // Se suman a lo que ya había, sin repetir por nombre.
                const existentes = new Set(menu.map(p => normalizar(p.name)));
                const nuevos = datos.platillos.filter((p: PlatilloEditable) => !existentes.has(normalizar(p.name)));
                onChange([...menu, ...nuevos]);
                setAviso(`Se leyeron ${nuevos.length} platillo(s). Revísalos antes de guardar.`);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo leer la carta.");
        } finally {
            setLeyendo(false);
        }
    };

    const subirPdf = async (archivo: File) => {
        if (!storage) return setError("Storage no está disponible.");
        if (archivo.type !== "application/pdf") return setError("El archivo debe ser un PDF.");
        setSubiendo(true); setError(null); setAviso(null);
        try {
            const referencia = ref(storage, `menus/${lugarId || "nuevo"}/${Date.now()}_${archivo.name}`);
            const subida = await uploadBytes(referencia, archivo);
            const url = await getDownloadURL(subida.ref);
            setFuente(url);
            await leerDesde(url);
        } catch (e) {
            setError(mensajeDeError(e));
        } finally {
            setSubiendo(false);
        }
    };

    const editar = (indice: number, campo: keyof PlatilloEditable, valor: string) => {
        onChange(menu.map((p, i) => i === indice
            ? { ...p, [campo]: campo === "price" ? Number(valor) || 0 : valor }
            : p));
    };

    return (
        <div className={styles.menuBloque}>
            <div className={styles.menuOrigen}>
                <div className={styles.menuFuente}>
                    <input
                        value={fuente}
                        onChange={e => setFuente(e.target.value)}
                        placeholder="Dirección de la carta del lugar (PDF o página)"
                    />
                    <button
                        type="button"
                        className={styles.primaryBtn}
                        disabled={!fuente.trim() || leyendo}
                        onClick={() => leerDesde(fuente.trim())}
                    >
                        {leyendo ? "Leyendo…" : "Leer carta"}
                    </button>
                </div>
                <label className={styles.menuConteo} style={{ cursor: "pointer" }}>
                    {subiendo ? "Subiendo el PDF…" : "…o sube el PDF de la carta"}
                    <input
                        type="file"
                        accept="application/pdf"
                        style={{ display: "none" }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) subirPdf(f); }}
                    />
                </label>
            </div>

            {error && <p className={styles.menuError}>{error}</p>}
            {aviso && <p className={styles.menuAviso}>{aviso}</p>}

            {menu.length > 0 && (
                <>
                    <div className={styles.menuEncabezado}>
                        <span>Platillo</span><span>Descripción</span><span>Precio</span><span />
                    </div>
                    <div className={styles.menuTabla}>
                        {menu.map((platillo, indice) => (
                            <div key={indice} className={styles.menuFila}>
                                <input value={platillo.name} onChange={e => editar(indice, "name", e.target.value)} />
                                <input
                                    value={platillo.description || ""}
                                    onChange={e => editar(indice, "description", e.target.value)}
                                    placeholder={platillo.section ? `— ${platillo.section}` : "Sin descripción"}
                                />
                                <input type="number" value={platillo.price} onChange={e => editar(indice, "price", e.target.value)} />
                                <button
                                    type="button"
                                    className={styles.deleteBtn}
                                    title="Quitar platillo"
                                    onClick={() => onChange(menu.filter((_, i) => i !== indice))}
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <div className={styles.menuPie}>
                <span className={styles.menuConteo}>
                    {menu.length === 0 ? "Sin platillos todavía" : `${menu.length} platillo(s)`}
                </span>
                <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => onChange([...menu, { name: "", price: 0 }])}
                >
                    <FaPlus /> Agregar platillo
                </button>
            </div>
        </div>
    );
}

type ChefDelLugar = { nombre: string; id?: string; previo?: boolean };
/** Lo que el gestor necesita de una ficha de chef. */
type FichaDeChef = { id: string; name: string; restaurant?: string };
/** Lo que el gestor necesita del documento del lugar. */
type LugarEditable = {
    chefsLista?: ChefDelLugar[];
    chefsNombres?: string[];
    chefIds?: string[];
    chefIdsPrevios?: string[];
    chef?: string;
};

/**
 * La lista que edita el formulario. Sale del documento en cualquiera de sus dos
 * formas: la nueva (arreglos) y la vieja (un texto con comas), porque el
 * directorio todavía no está migrado del todo.
 */
function chefsDelLugar(lugar: LugarEditable | null | undefined): ChefDelLugar[] {
    if (Array.isArray(lugar?.chefsLista)) return lugar.chefsLista;

    const nombres: string[] = Array.isArray(lugar?.chefsNombres) && lugar.chefsNombres.length
        ? lugar.chefsNombres
        : separarNombres(lugar?.chef);
    const ids: string[] = Array.isArray(lugar?.chefIds) ? lugar.chefIds : [];
    const previos: string[] = Array.isArray(lugar?.chefIdsPrevios) ? lugar.chefIdsPrevios : [];

    return nombres.map((nombre, i) => ({
        nombre,
        id: ids[i],
        previo: Boolean(ids[i] && previos.includes(ids[i])),
    }));
}


/**
 * Un restaurante puede tener dos chefs, y puede tener chefs que ya se fueron.
 * Escribirlos separados por coma en un solo campo era justo lo que hacía que se
 * perdiera el segundo al editar; aquí se agregan y se quitan de uno en uno.
 */
function GestorDeChefs({
    lista,
    fichas,
    onChange,
}: {
    lista: ChefDelLugar[];
    fichas: FichaDeChef[];
    onChange: (siguiente: ChefDelLugar[]) => void;
}) {
    const [nuevoNombre, setNuevoNombre] = useState("");

    const yaEsta = (nombre: string, id?: string) =>
        lista.some(c => (id && c.id === id) || normalizar(c.nombre) === normalizar(nombre));

    const agregarDeFicha = (chefId: string) => {
        const ficha = fichas.find(f => f.id === chefId);
        if (!ficha || yaEsta(ficha.name, ficha.id)) return;
        onChange([...lista, { nombre: ficha.name, id: ficha.id }]);
    };

    const agregarSuelto = () => {
        const nombre = nuevoNombre.trim();
        if (!nombre || yaEsta(nombre)) return setNuevoNombre("");
        // Si el nombre coincide con una ficha existente, se enlaza solo.
        const ficha = fichas.find(f => normalizar(f.name) === normalizar(nombre));
        onChange([...lista, { nombre: ficha ? ficha.name : nombre, id: ficha?.id }]);
        setNuevoNombre("");
    };

    const disponibles = fichas.filter(f => !lista.some(c => c.id === f.id));

    return (
        <>
            <label>Chefs del lugar</label>
            <div className={styles.chefsLista}>
                {lista.length === 0 && <span className={styles.chefsVacio}>Sin chefs asignados.</span>}
                {lista.map((chef, indice) => (
                    <div key={`${chef.nombre}-${indice}`} className={styles.chefFila}>
                        <span className={styles.chefNombre}>
                            {chef.nombre}
                            {chef.id
                                ? <em className={styles.chefEtiquetaOk}>con ficha</em>
                                : <em className={styles.chefEtiquetaSin}>sin ficha</em>}
                        </span>
                        <label className={styles.chefPrevio}>
                            <input
                                type="checkbox"
                                checked={Boolean(chef.previo)}
                                onChange={e => onChange(lista.map((c, i) => i === indice ? { ...c, previo: e.target.checked } : c))}
                            />
                            Ya no está
                        </label>
                        <button
                            type="button"
                            className={styles.deleteBtn}
                            title="Quitar"
                            onClick={() => onChange(lista.filter((_, i) => i !== indice))}
                        >
                            <FaTimes />
                        </button>
                    </div>
                ))}
            </div>

            <div className={styles.chefAgregar}>
                <select
                    value=""
                    onChange={e => { agregarDeFicha(e.target.value); e.target.value = ""; }}
                    disabled={disponibles.length === 0}
                >
                    <option value="">
                        {disponibles.length === 0 ? "No quedan fichas por agregar" : "Agregar un chef del directorio…"}
                    </option>
                    {disponibles.map(f => (
                        <option key={f.id} value={f.id}>{f.name}{f.restaurant ? ` · ${f.restaurant}` : ""}</option>
                    ))}
                </select>
                <div className={styles.chefAgregarSuelto}>
                    <input
                        value={nuevoNombre}
                        onChange={e => setNuevoNombre(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); agregarSuelto(); } }}
                        placeholder="…o escribe un chef que todavía no tiene ficha"
                    />
                    <button type="button" className={styles.editBtn} onClick={agregarSuelto} title="Agregar">
                        <FaPlus />
                    </button>
                </div>
            </div>
        </>
    );
}

function SelectorDueno({
    usuarios,
    valor,
    onChange,
}: {
    usuarios: { uid: string; email?: string; displayName?: string }[];
    valor?: string;
    onChange: (uid: string | undefined) => void;
}) {
    return (
        <>
            <label>Dueño (usuario registrado)</label>
            <select value={valor || ''} onChange={e => onChange(e.target.value || undefined)}>
                <option value="">Sin asignar — lo administra la redacción</option>
                {usuarios.map(u => (
                    <option key={u.uid} value={u.uid}>
                        {u.displayName ? `${u.displayName} · ${u.email}` : u.email || u.uid}
                    </option>
                ))}
            </select>
            {usuarios.length === 0 && (
                <small style={{ color: '#8a9690' }}>
                    Todavía no hay personas registradas en la base. Aparecerán aquí la próxima vez que inicien sesión.
                </small>
            )}
            {valor && !usuarios.some(u => u.uid === valor) && (
                <small style={{ color: '#b4552d' }}>
                    Asignado a un usuario que ya no está en la lista ({valor}).
                </small>
            )}
        </>
    );
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState<'dashboard' | 'restaurantes' | 'chefs' | 'guias' | 'nominaciones' | 'reclamaciones' | 'usuarios' | 'reservas'>('dashboard');
    // Rol del usuario en sesión: define qué ve y qué puede hacer en el panel.
    // Un curador ve Lugares/Chefs/Guías para crear y editar; las pestañas de
    // moderación (nominaciones, reclamaciones, usuarios), el borrado y los campos
    // de autoridad (Michelin, destacado, dueño) quedan sólo para el admin.
    const [miRol, setMiRol] = useState<'admin' | 'curator' | 'user'>('user');
    const esAdmin = miRol === 'admin';
    const esCurador = miRol === 'curator';
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [chefs, setChefs] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [guides, setGuides] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [chefNominations, setChefNominations] = useState<any[]>([]);
    const [placeNominations, setPlaceNominations] = useState<any[]>([]);
    const [claims, setClaims] = useState<any[]>([]);
    const [workingId, setWorkingId] = useState<string | null>(null);
    const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
    const [editingChef, setEditingChef] = useState<any>(null);
    const [editingGuide, setEditingGuide] = useState<any>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSyncingChefs, setIsSyncingChefs] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    // Búsqueda + paginación de los directorios para no scrollear listas enormes.
    const [restQuery, setRestQuery] = useState('');
    const [restPage, setRestPage] = useState(1);
    const [chefQuery, setChefQuery] = useState('');
    const [chefPage, setChefPage] = useState(1);
    const POR_PAGINA = 12;
    // Barra lateral plegable: colapsada deja solo iconos y da más ancho al editar.
    const [sidebarColapsado, setSidebarColapsado] = useState(false);
    // En móvil la barra lateral es un cajón (drawer) que abre un botón hamburguesa.
    const [menuMobil, setMenuMobil] = useState(false);
    useEffect(() => {
        try { setSidebarColapsado(localStorage.getItem('adminSidebarColapsado') === '1'); } catch { /* sin storage */ }
    }, []);
    const alternarSidebar = () => setSidebarColapsado(prev => {
        const siguiente = !prev;
        try { localStorage.setItem('adminSidebarColapsado', siguiente ? '1' : '0'); } catch { /* sin storage */ }
        return siguiente;
    });

    const APP_DOMAIN = "comeapp.com.mx";

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // Un curador no tiene esas pestañas; si el estado quedó ahí, lo llevamos a
    // una que sí puede ver.
    useEffect(() => {
        if (esCurador && ['dashboard', 'nominaciones', 'reclamaciones', 'usuarios', 'reservas'].includes(activeSection)) {
            setActiveSection('restaurantes');
        }
    }, [esCurador, activeSection]);

    const fetchData = async () => {
        if (!db || !user) return;
        setLoading(true);
        try {
            // 1) Rol de quien entra. Los correos de arranque son admin; el resto
            //    sale de su ficha. Un curador no puede leer moderación ni usuarios,
            //    así que esas lecturas se saltan para no romper el panel entero.
            const ADMIN_EMAILS = ['dbitdev@gmail.com', 'admin@come.mx', 'parradabito@gmail.com'];
            let rol: 'admin' | 'curator' | 'user' = ADMIN_EMAILS.includes(user.email || '') ? 'admin' : 'user';
            if (rol !== 'admin') {
                // Lectura robusta: AuthContext deja una escritura pendiente que
                // enmascara el rol recién asignado (ver leerRolDeUsuario).
                const r = await leerRolDeUsuario(db, user.uid);
                if (r === 'admin') rol = 'admin';
                else if (r === 'curator') rol = 'curator';
            }
            setMiRol(rol);
            const admin = rol === 'admin';

            // 2) Contenido que todos (admin y curador) pueden ver y curar.
            const restSnapshot = await getDocs(collection(db, "come"));
            const restData = restSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRestaurants(restData);

            const chefsSnapshot = await getDocs(collection(db, "chefs"));
            setChefs(chefsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const guidesSnapshot = await getDocs(collection(db, "guides"));
            setGuides(guidesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // 3) Sólo admin: bandejas de moderación y padrón de usuarios.
            if (admin) {
                setLeads(restData.filter((r: any) => r.status === 'pending'));
                try {
                    const [chefNomSnap, placeNomSnap, claimsSnap] = await Promise.all([
                        getDocs(collection(db, "chef_nominations")),
                        getDocs(collection(db, "place_nominations")),
                        getDocs(collection(db, "profile_claims")),
                    ]);
                    setChefNominations(chefNomSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    setPlaceNominations(placeNomSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    setClaims(claimsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } catch { /* reglas o red: la bandeja queda vacía */ }
                try {
                    const usuariosSnap = await getDocs(collection(db, "users"));
                    setUsuarios(usuariosSnap.docs.map(d => ({ uid: d.id, ...d.data() })));
                } catch { /* sin permiso: el selector de dueño queda vacío */ }
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    const revisarReclamacion = async (claim: any, decision: 'approved' | 'rejected') => {
        if (!user) return;
        const verificationNotes = window.prompt(
            decision === 'approved'
                ? "Describe qué comprobaste antes de aprobar (correo de dominio, llamada, documento, etc.)."
                : "Indica por qué se rechaza la solicitud."
        )?.trim();
        if (!verificationNotes) return;
        setWorkingId(claim.id);
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/claims/${claim.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ decision, verificationNotes }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'No se pudo revisar.');
            await fetchData();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'No se pudo revisar la reclamación.');
        } finally {
            setWorkingId(null);
        }
    };

    // Publicar una nominación la copia a su colección definitiva y la retira de
    // la bandeja; rechazar sólo la borra.
    const publicarNominacion = async (nominacion: any, destino: 'chefs' | 'come', origen: string) => {
        if (!db) return;
        setWorkingId(nominacion.id);
        try {
            const { id, status, ...datos } = nominacion;
            void status;
            await addDoc(collection(db, destino), {
                ...datos,
                slug: slugify(datos.name || datos.restaurantName || id),
                status: 'published',
                publishedAt: serverTimestamp(),
            });
            await deleteDoc(doc(db, origen, id));
            await fetchData();
        } catch (err) {
            console.error("No se pudo publicar la nominación:", err);
            alert("No se pudo publicar. Revisa la consola para el detalle.");
        } finally {
            setWorkingId(null);
        }
    };

    const rechazarNominacion = async (nominacionId: string, origen: string) => {
        if (!db || !confirm("¿Descartar esta nominación? No se puede deshacer.")) return;
        setWorkingId(nominacionId);
        try {
            await deleteDoc(doc(db, origen, nominacionId));
            await fetchData();
        } catch (err) {
            console.error("No se pudo descartar la nominación:", err);
        } finally {
            setWorkingId(null);
        }
    };

    // Aprobar un negocio registrado lo hace visible en el directorio público.
    const publicarNegocio = async (negocioId: string) => {
        if (!db) return;
        setWorkingId(negocioId);
        try {
            await updateDoc(doc(db, "come", negocioId), { status: 'published', publishedAt: serverTimestamp() });
            await fetchData();
        } catch (err) {
            console.error("No se pudo publicar el negocio:", err);
        } finally {
            setWorkingId(null);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingRestaurant || !storage) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `restaurants/${editingRestaurant.id || 'new'}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            setEditingRestaurant({ ...editingRestaurant, image: downloadURL });
            alert("Imagen subida con éxito");
        } catch (err) {
            console.error("Error uploading image:", err);
            alert(mensajeDeError(err));
        } finally {
            setIsUploading(false);
        }
    };

    const handleSyncMichelin = async () => {
        if (!db || isSyncing) return;
        setIsSyncing(true);
        try {
            const michelinLocales = [
                {
                    name: "Pujol",
                    distincion: "2 Estrellas + Estrella Verde",
                    chef: "Enrique Olvera",
                    category: "Mexicana Contemporánea",
                    address: "Tennyson 133, Polanco, Miguel Hidalgo, CDMX",
                    signatureDishes: ["Mole Madre, Mole Nuevo", "Taco Omakase de temporada"],
                    rating: 4.9,
                    isMichelin: true,
                    michelinStars: 2,
                    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200",
                    description: "Cocina de alta calidad, excepcional o extraordinaria. 2 Estrellas + Estrella Verde."
                },
                {
                    name: "Quintonil",
                    distincion: "2 Estrellas",
                    chef: "Jorge Vallejo",
                    category: "Mexicana Moderna",
                    address: "Newton 55, Polanco, Miguel Hidalgo, CDMX",
                    signatureDishes: ["Tartar de aguacate con escamoles", "Nieve de nopal"],
                    rating: 4.9,
                    isMichelin: true,
                    michelinStars: 2,
                    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200",
                    description: "Cocina de alta calidad, excepcional o extraordinaria."
                },
                {
                    name: "Taquería El Califa de León",
                    distincion: "1 Estrella",
                    chef: "Arturo Rivera Martínez",
                    category: "Taquería Tradicional",
                    address: "Av. Ribera de San Cosme 56, San Rafael, CDMX",
                    signatureDishes: ["Taco Gaonera", "Taco de Bistec"],
                    rating: 4.7,
                    isMichelin: true,
                    michelinStars: 1,
                    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200",
                    description: "Taquería Tradicional con 1 Estrella Michelin."
                },
                {
                    name: "Levadura de Olla",
                    distincion: "1 Estrella",
                    chef: "Thalía Barrios",
                    category: "Oaxaqueña Tradicional",
                    address: "C. de Manuel García Vigil 304, Centro, Oaxaca",
                    signatureDishes: ["Ensalada de tomates nativos", "Mole de mesa"],
                    rating: 4.8,
                    isMichelin: true,
                    michelinStars: 1,
                    image: "https://images.unsplash.com/photo-1581488109695-1ed571217e4f?auto=format&fit=crop&w=1200",
                    description: "Cocina Oaxaqueña Tradicional destacada con 1 Estrella."
                },
                {
                    name: "Animalón",
                    distincion: "1 Estrella",
                    chef: "Javier Plascencia / Oscar Torres",
                    category: "Baja Med",
                    address: "Carretera Tecate-Ensenada Km. 83, Baja California",
                    signatureDishes: ["Menú bajo el encino de 200 años"],
                    rating: 4.8,
                    isMichelin: true,
                    michelinStars: 1,
                    image: "https://images.unsplash.com/photo-1550966841-36f9adac97ce?auto=format&fit=crop&w=1200",
                    description: "Experiencia gastronómica bajo un encino centenario."
                },
                {
                    name: "Le Chique",
                    distincion: "1 Estrella",
                    chef: "Jonatán Gómez Luna",
                    category: "Vanguardia Mexicana",
                    address: "Azul Beach Resort, Puerto Morelos, Quintana Roo",
                    signatureDishes: ["Viaje culinario por México (Menú degustación)"],
                    rating: 4.9,
                    isMichelin: true,
                    michelinStars: 1,
                    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200",
                    description: "Vanguardia Mexicana en el Caribe."
                },
                {
                    name: "Contramar",
                    distincion: "Bib Gourmand",
                    chef: "Gabriela Cámara",
                    category: "Mariscos",
                    address: "Durango 200, Roma Norte, CDMX",
                    signatureDishes: ["Pescado a la talla"],
                    rating: 4.8,
                    isMichelin: false,
                    michelinStars: 0,
                    lat: 19.4201,
                    lng: -99.1633,
                    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1200",
                    description: "Mejor relación calidad-precio."
                },
                {
                    name: "Alfonsina",
                    distincion: "Bib Gourmand",
                    chef: "Jorge León",
                    category: "Oaxaqueña de Mercado",
                    address: "Calle Garcia Vigil 5, San Juan Bautista la Raya, Oaxaca",
                    lat: 17.0094,
                    lng: -96.7225,
                    signatureDishes: ["Tlayudas gourmet", "Mole negro"],
                    rating: 4.8,
                    isMichelin: false,
                    michelinStars: 0,
                    image: "https://images.unsplash.com/photo-1541544741938-0af808871bdc?auto=format&fit=crop&w=1200",
                    description: "Bib Gourmand: Cocina excepcional por menos de $900 MXN."
                }
            ];

            for (const locale of michelinLocales) {
                const data = {
                    restaurantName: locale.name,
                    category: locale.category,
                    address: locale.address,
                    lat: locale.lat || 0,
                    lng: locale.lng || 0,
                    chef: locale.chef,
                    description: locale.description,
                    signatureDishes: locale.signatureDishes,
                    rating: locale.rating,
                    isMichelin: locale.isMichelin,
                    michelinStars: locale.michelinStars || 0,
                    awards: locale.distincion,
                    image: locale.image,
                    lastUpdated: serverTimestamp(),
                    subdomain: locale.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + "." + APP_DOMAIN
                };
                
                const existing = restaurants.find(r => r.restaurantName === locale.name);
                if (existing) {
                    console.log(`Skipping existing restaurant to preserve manual edits: ${locale.name}`);
                    continue; // Skip if already exists
                } else {
                    await addDoc(collection(db, "come"), data);
                }
            }
            alert("Sincronización Michelin completada con éxito");
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error sincronizando: " + (err as any).message);
        } finally {
            setIsSyncing(false);
        }
    };

    // Designar rol a un usuario. '' = usuario normal; 'curator'; 'admin'.
    // Las reglas de Firestore sólo permiten esto a un admin, así que un curador
    // o un usuario común no puede promoverse aunque manipule la interfaz.
    const [rolCambiando, setRolCambiando] = useState<string | null>(null);
    const cambiarRol = async (uid: string, role: string) => {
        if (!db) return;
        setRolCambiando(uid);
        try {
            await updateDoc(doc(db, "users", uid), { role });
            setUsuarios(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
        } catch (err) {
            console.error(err);
            alert("No se pudo cambiar el rol. ¿Sigues con sesión de admin?");
        } finally {
            setRolCambiando(null);
        }
    };

    const handleSaveRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !editingRestaurant) return;
        try {
            const { id, ...data } = editingRestaurant;
            Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
            
            const rName = data.restaurantName || data.name || "";
            data.subdomain = rName.toLowerCase().replace(/[^a-z0-9]/g, '-') + "." + APP_DOMAIN;

            // La lista del formulario se traduce a los tres campos que consultan el
            // sitio y la app. `chef` se conserva como texto derivado para el
            // código que todavía lo lee.
            const lista = chefsDelLugar(editingRestaurant);
            delete data.chefsLista;
            const actuales = lista.filter(c => !c.previo);
            data.chefsNombres = actuales.map(c => c.nombre);
            data.chefIds = actuales.map(c => c.id).filter(Boolean);
            data.chefIdsPrevios = lista.filter(c => c.previo).map(c => c.id).filter(Boolean);
            data.chef = textoDeChefs(data.chefsNombres);
            let vinculados = data.chefIds as string[];

            // Un platillo sin nombre es una fila que quedó a medias.
            if (Array.isArray(data.menu)) {
                data.menu = data.menu
                    .filter((p: PlatilloEditable) => p?.name?.trim())
                    .map((p: PlatilloEditable) => ({
                        name: p.name.trim(),
                        price: Number(p.price) || 0,
                        ...(p.description?.trim() ? { description: p.description.trim() } : {}),
                        ...(p.section ? { section: p.section } : {}),
                    }));
            }

            let restaurantId = id;
            if (id) {
                await updateDoc(doc(db, "come", id), {
                    ...data,
                    lastUpdated: serverTimestamp()
                });
            } else {
                const creado = await addDoc(collection(db, "come"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
                restaurantId = creado.id;
            }

            // Un nombre nuevo escrito desde el restaurante crea inmediatamente
            // su ficha de chef. Si la ficha ya existía, sólo completa el vínculo
            // inverso. La comparación es exacta y normalizada para no duplicar.
            const idsResueltos: string[] = [];
            for (const chefElegido of actuales) {
                let chefId = chefElegido.id;
                const existente = chefs.find(c => normalizar(c.name || "") === normalizar(chefElegido.nombre));
                if (!chefId && existente) chefId = existente.id;
                if (!chefId) {
                    const creado = await addDoc(collection(db, "chefs"), {
                        name: chefElegido.nombre,
                        restaurant: rName,
                        restaurantIds: restaurantId ? [restaurantId] : [],
                        status: "published",
                        createdAt: serverTimestamp(),
                    });
                    chefId = creado.id;
                } else if (restaurantId) {
                    await updateDoc(doc(db, "chefs", chefId), {
                        restaurantIds: arrayUnion(restaurantId),
                        restaurant: existente?.restaurant || rName,
                        lastUpdated: serverTimestamp(),
                    });
                }
                idsResueltos.push(chefId);
            }
            vinculados = idsResueltos;
            if (restaurantId) {
                await updateDoc(doc(db, "come", restaurantId), {
                    chefIds: idsResueltos,
                    chefsNombres: actuales.map(c => c.nombre),
                    chef: textoDeChefs(actuales.map(c => c.nombre)),
                    lastUpdated: serverTimestamp(),
                });
            }
            setEditingRestaurant(null);
            fetchData();
            alert(`Restaurante guardado. ${vinculados.length} chef(s) con ficha enlazada.`);
        } catch (err) {
            console.error(err);
            alert("Error al guardar");
        }
    };

    const handleDeleteRestaurant = async (id: string) => {
        if (!db || !window.confirm("¿Estás seguro de eliminar este restaurante?")) return;
        try {
            await deleteDoc(doc(db, "come", id));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    /**
     * Añade el chef a `chefIds` de todo lugar cuyo campo de chefs lo mencione.
     * La relación se guarda sólo en el lugar: si viviera también en la ficha del
     * chef habría dos copias de lo mismo que se pueden contradecir.
     */
    const enlazarChefConSusLugares = async (chefId: string | undefined, nombre: string) => {
        if (!db || !chefId || !nombre) return [];
        const coincidencias = lugaresQueMencionan(
            nombre,
            restaurants.map(r => ({ id: r.id, nombre: r.restaurantName || r.name || "", chef: r.chef })),
        );
        const enlazados: string[] = [];
        for (const lugar of coincidencias) {
            const actual = restaurants.find(r => r.id === lugar.id);
            const yaEstaban: string[] = Array.isArray(actual?.chefIds) ? actual.chefIds : [];
            if (yaEstaban.includes(chefId)) continue;
            await updateDoc(doc(db, "come", lugar.id), {
                chefIds: [...yaEstaban, chefId],
                chefsNombres: separarNombres(actual?.chef),
                lastUpdated: serverTimestamp(),
            });
            enlazados.push(lugar.nombre);
        }
        return enlazados;
    };

    const handleSaveChef = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !editingChef) return;
        try {
            const { id, ...data } = editingChef;
            let chefId = id;
            if (id) {
                await updateDoc(doc(db, "chefs", id), {
                    ...data,
                    lastUpdated: serverTimestamp()
                });
            } else {
                const creado = await addDoc(collection(db, "chefs"), {
                    ...data,
                    createdAt: serverTimestamp()
                });
                chefId = creado.id;
            }

            // La operación inversa también crea el restaurante principal si no
            // existe todavía y deja ambos documentos enlazados por id.
            const nombreRestaurante = typeof data.restaurant === "string" ? data.restaurant.trim() : "";
            if (chefId && nombreRestaurante) {
                let lugar = restaurants.find(r => normalizar(r.restaurantName || r.name || "") === normalizar(nombreRestaurante));
                let lugarId = lugar?.id as string | undefined;
                if (!lugarId) {
                    const creado = await addDoc(collection(db, "come"), {
                        restaurantName: nombreRestaurante,
                        category: "Restaurante",
                        chef: data.name,
                        chefsNombres: [data.name],
                        chefIds: [chefId],
                        image: "/og-come.jpg",
                        status: "published",
                        subdomain: `${slugify(nombreRestaurante)}.${APP_DOMAIN}`,
                        createdAt: serverTimestamp(),
                    });
                    lugarId = creado.id;
                    lugar = { id: lugarId, restaurantName: nombreRestaurante, chefIds: [] };
                } else {
                    const nombres = Array.isArray(lugar.chefsNombres) ? lugar.chefsNombres : separarNombres(lugar.chef);
                    await updateDoc(doc(db, "come", lugarId), {
                        chefIds: arrayUnion(chefId),
                        chefsNombres: nombres.some((n: string) => normalizar(n) === normalizar(data.name)) ? nombres : [...nombres, data.name],
                        chef: textoDeChefs(nombres.some((n: string) => normalizar(n) === normalizar(data.name)) ? nombres : [...nombres, data.name]),
                        lastUpdated: serverTimestamp(),
                    });
                }
                await updateDoc(doc(db, "chefs", chefId), {
                    restaurantIds: arrayUnion(lugarId),
                    lastUpdated: serverTimestamp(),
                });
            }

            // Al dar de alta o renombrar un chef, engancharlo con los lugares que
            // ya lo mencionan por su nombre. Antes eso se quedaba sin conectar
            // hasta que alguien volviera a guardar el restaurante a mano.
            const enlazados = await enlazarChefConSusLugares(chefId, data.name);

            setEditingChef(null);
            fetchData();
            alert(
                enlazados.length > 0
                    ? `Chef guardado y enlazado con: ${enlazados.join(", ")}.`
                    : "Chef guardado. Ningún restaurante del directorio lo menciona todavía."
            );
        } catch (err) {
            console.error(err);
            alert("Error al guardar chef");
        }
    };
    const handleSaveGuide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db || !editingGuide) return;
        try {
            const { id, ...data } = editingGuide;
            const guideSlug = data.slug || slugify(data.title);
            
            const gData = {
                ...data,
                slug: guideSlug,
                updatedAt: new Date().toISOString(),
                restaurantIds: data.stops?.map((s: any) => s.location?.restaurantId).filter(Boolean) || []
            };

            if (id) {
                await updateDoc(doc(db, "guides", id), gData);
            } else {
                await addDoc(collection(db, "guides"), {
                    ...gData,
                    createdAt: new Date().toISOString(),
                    status: 'published'
                });
            }
            setEditingGuide(null);
            fetchData();
            alert("Guía guardada con éxito");
        } catch (err) {
            console.error(err);
            alert("Error al guardar guía");
        }
    };

    const handleDeleteGuide = async (id: string) => {
        if (!db || !window.confirm("¿Estás seguro de eliminar esta guía?")) return;
        try {
            await deleteDoc(doc(db, "guides", id));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteChef = async (id: string) => {
        if (!db || !window.confirm("¿Estás seguro de eliminar este chef?")) return;
        try {
            await deleteDoc(doc(db, "chefs", id));
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    // Directorios filtrados por búsqueda y recortados a la página actual. Se
    // calcula en render (listas en memoria, es barato) para que la lista no
    // obligue a scrollear cientos de fichas.
    const filtrarRest = restaurants.filter(r => {
        const q = restQuery.trim().toLowerCase();
        if (!q) return true;
        return `${r.restaurantName || r.name || ''} ${r.category || ''} ${r.address || ''}`.toLowerCase().includes(q);
    });
    const restPaginas = Math.max(1, Math.ceil(filtrarRest.length / POR_PAGINA));
    const restPagActual = Math.min(restPage, restPaginas);
    const restVisibles = filtrarRest.slice((restPagActual - 1) * POR_PAGINA, restPagActual * POR_PAGINA);

    const filtrarChefs = chefs.filter(c => {
        const q = chefQuery.trim().toLowerCase();
        if (!q) return true;
        return `${c.name || ''} ${c.specialty || ''} ${c.restaurant || ''} ${c.ubicacion || ''}`.toLowerCase().includes(q);
    });
    const chefPaginas = Math.max(1, Math.ceil(filtrarChefs.length / POR_PAGINA));
    const chefPagActual = Math.min(chefPage, chefPaginas);
    const chefVisibles = filtrarChefs.slice((chefPagActual - 1) * POR_PAGINA, chefPagActual * POR_PAGINA);

    return (
        <AdminGuard>
            <div className={styles.adminWrapper}>
                <button
                    type="button"
                    className={styles.hamburguesa}
                    onClick={() => setMenuMobil(true)}
                    aria-label="Abrir menú"
                >
                    <FaBars />
                </button>
                {menuMobil && <div className={styles.backdrop} onClick={() => setMenuMobil(false)} />}
                <aside className={`${styles.sidebar} ${sidebarColapsado ? styles.sidebarColapsado : ''} ${menuMobil ? styles.sidebarMobilAbierto : ''}`}>
                    <div className={styles.adminLogo}>
                        <FaShieldAlt /> <span className={styles.navLabel}>Come Admin</span>
                        <button
                            type="button"
                            className={styles.colapsarBtn}
                            onClick={alternarSidebar}
                            title={sidebarColapsado ? "Expandir menú" : "Colapsar menú"}
                            aria-label={sidebarColapsado ? "Expandir menú" : "Colapsar menú"}
                        >
                            {sidebarColapsado ? <FaAngleRight /> : <FaAngleLeft />}
                        </button>
                    </div>
                    {esCurador && <div className={styles.rolAviso}><FaUserShield /> <span className={styles.navLabel}>Modo curador</span></div>}
                    <nav className={styles.nav} onClick={() => setMenuMobil(false)}>
                        {esAdmin && <button title="Dashboard" onClick={() => setActiveSection('dashboard')} className={activeSection === 'dashboard' ? styles.navItemActive : styles.navItem}><FaChartBar /> <span className={styles.navLabel}>Dashboard</span></button>}
                        <button title="Negocios / Lugares" onClick={() => setActiveSection('restaurantes')} className={activeSection === 'restaurantes' ? styles.navItemActive : styles.navItem}><FaUtensils /> <span className={styles.navLabel}>Negocios / Lugares</span></button>
                        <button title="Directorio de Chefs" onClick={() => setActiveSection('chefs')} className={activeSection === 'chefs' ? styles.navItemActive : styles.navItem}><FaUsers /> <span className={styles.navLabel}>Directorio de Chefs</span></button>
                        <button title="Guías Interactivas" onClick={() => setActiveSection('guias')} className={activeSection === 'guias' ? styles.navItemActive : styles.navItem}><FaMapMarkerAlt /> <span className={styles.navLabel}>Guías Interactivas</span></button>
                        {esAdmin && <button title="Reservaciones" onClick={() => setActiveSection('reservas')} className={activeSection === 'reservas' ? styles.navItemActive : styles.navItem}><FaCalendarAlt /> <span className={styles.navLabel}>Reservaciones</span></button>}
                        {esAdmin && <button title="Nominaciones" onClick={() => setActiveSection('nominaciones')} className={activeSection === 'nominaciones' ? styles.navItemActive : styles.navItem}>
                            <FaConciergeBell /> <span className={styles.navLabel}>Nominaciones</span>
                            {(chefNominations.length + placeNominations.length + leads.length) > 0 && <span className={styles.badge}>{chefNominations.length + placeNominations.length + leads.length}</span>}
                        </button>}
                        {esAdmin && <button title="Reclamaciones" onClick={() => setActiveSection('reclamaciones')} className={activeSection === 'reclamaciones' ? styles.navItemActive : styles.navItem}><FaShieldAlt /> <span className={styles.navLabel}>Reclamaciones</span></button>}
                        {esAdmin && <button title="Usuarios" onClick={() => setActiveSection('usuarios')} className={activeSection === 'usuarios' ? styles.navItemActive : styles.navItem}><FaUserShield /> <span className={styles.navLabel}>Usuarios</span></button>}
                    </nav>

                    <div className={styles.sidebarFooter}>
                        {esAdmin && (
                            <button
                                onClick={handleSyncMichelin}
                                className={styles.primaryBtn}
                                style={{ background: isSyncing ? '#444' : 'var(--primary)' }}
                                disabled={isSyncing}
                                title="Sincronizar Michelin"
                            >
                                <FaSync className={isSyncing ? styles.spin : ""} /> <span className={styles.navLabel}>{isSyncing ? "Sincronizando..." : "Sincronizar Michelin"}</span>
                            </button>
                        )}
                        <Link href="/" className={styles.sitioLink} title="Ir al sitio">
                            <FaExternalLinkAlt /> <span className={styles.navLabel}>Ir al sitio</span>
                        </Link>
                    </div>
                </aside>

                <main className={styles.mainContent}>
                    <header className={styles.header}>
                        <div>
                            <span className={styles.eyebrow}>PANEL DE REDACCIÓN</span>
                            <h1>{TITULOS[activeSection]}</h1>
                        </div>
                        <div className={styles.userTag}>{user?.email}</div>
                    </header>

                    {loading ? (
                        <div className={styles.loading}>Cargando datos...</div>
                    ) : (
                        <>
                            {activeSection === 'dashboard' && (
                                <>
                                    <div className={styles.statsGrid}>
                                        <div className={styles.statCard}>
                                            <h3>Negocios Totales</h3>
                                            <p>{restaurants.length}</p>
                                        </div>
                                        <div className={styles.statCard}>
                                            <h3>Estrellas Michelin</h3>
                                            <p>{restaurants.filter(r => r.isMichelin).length}</p>
                                        </div>
                                        <div className={styles.statCard}>
                                            <h3>Catálogo Digital</h3>
                                            <p>{restaurants.filter(r => r.menu?.length > 0).length}</p>
                                        </div>
                                        <div className={styles.statCard}>
                                            <h3>Por revisar</h3>
                                            <p>{chefNominations.length + placeNominations.length + leads.length}</p>
                                        </div>
                                    </div>
                                    
                                    <section className={styles.tableSection}>
                                        <h2>Negocios en espera de aprobación</h2>
                                        <table className={styles.adminTable}>
                                            <thead>
                                                <tr>
                                                    <th>Nombre</th>
                                                    <th>Categoría</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leads.map(lead => (
                                                    <tr key={lead.id}>
                                                        <td>{lead.restaurantName || lead.name}</td>
                                                        <td><span className={styles.subdomainTag}>{lead.category}</span></td>
                                                        <td className={styles.actions}>
                                                            <button className={styles.editBtn} onClick={() => { setEditingRestaurant(lead); setActiveSection('restaurantes'); }}><FaEdit /></button>
                                                            <button className={styles.publishBtn} disabled={workingId === lead.id} onClick={() => publicarNegocio(lead.id)}>Publicar</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {leads.length === 0 && (
                                                    <tr><td colSpan={3} className={styles.emptyRow}>No hay negocios pendientes de revisión.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </section>
                                </>
                            )}

                            {activeSection === 'nominaciones' && (
                                <>
                                    <section className={styles.tableSection}>
                                        <h2>Lugares nominados ({placeNominations.length})</h2>
                                        <table className={styles.adminTable}>
                                            <thead>
                                                <tr><th>Lugar</th><th>Categoría</th><th>Dirección</th><th>Acciones</th></tr>
                                            </thead>
                                            <tbody>
                                                {placeNominations.map(nom => (
                                                    <tr key={nom.id}>
                                                        <td>{nom.restaurantName}</td>
                                                        <td><span className={styles.subdomainTag}>{nom.category}</span></td>
                                                        <td>{nom.address}</td>
                                                        <td className={styles.actions}>
                                                            <button className={styles.publishBtn} disabled={workingId === nom.id} onClick={() => publicarNominacion(nom, 'come', 'place_nominations')}>Publicar</button>
                                                            <button className={styles.deleteBtn} disabled={workingId === nom.id} onClick={() => rechazarNominacion(nom.id, 'place_nominations')}><FaTrash /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {placeNominations.length === 0 && (
                                                    <tr><td colSpan={4} className={styles.emptyRow}>Sin nominaciones de lugares.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </section>

                                    <section className={styles.tableSection}>
                                        <h2>Chefs nominados ({chefNominations.length})</h2>
                                        <table className={styles.adminTable}>
                                            <thead>
                                                <tr><th>Chef</th><th>Especialidad</th><th>Trayectoria</th><th>Acciones</th></tr>
                                            </thead>
                                            <tbody>
                                                {chefNominations.map(nom => (
                                                    <tr key={nom.id}>
                                                        <td>{nom.name}</td>
                                                        <td><span className={styles.subdomainTag}>{nom.specialty}</span></td>
                                                        <td className={styles.clampCell}>{nom.trajectory || nom.bio}</td>
                                                        <td className={styles.actions}>
                                                            <button className={styles.publishBtn} disabled={workingId === nom.id} onClick={() => publicarNominacion(nom, 'chefs', 'chef_nominations')}>Publicar</button>
                                                            <button className={styles.deleteBtn} disabled={workingId === nom.id} onClick={() => rechazarNominacion(nom.id, 'chef_nominations')}><FaTrash /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {chefNominations.length === 0 && (
                                                    <tr><td colSpan={4} className={styles.emptyRow}>Sin nominaciones de chefs.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </section>
                                </>
                            )}

                            {activeSection === 'reclamaciones' && (
                                <section className={styles.tableSection}>
                                    <h2>Perfiles reclamados</h2>
                                    <p>Aprueba únicamente después de comprobar que la persona representa al perfil o a la marca.</p>
                                    <table className={styles.adminTable}>
                                        <thead><tr><th>Perfil</th><th>Solicitante y evidencia</th><th>Estado</th><th>Revisión</th></tr></thead>
                                        <tbody>
                                            {claims.map((claim) => (
                                                <tr key={claim.id}>
                                                    <td><strong>{claim.entityName}</strong><br/><small>{claim.entityType === 'chef' ? 'Chef' : 'Lugar'} · {claim.relationship}</small></td>
                                                    <td>
                                                        <a href={`mailto:${claim.businessEmail}`}>{claim.businessEmail}</a><br/>
                                                        {claim.phone && <><span>{claim.phone}</span><br/></>}
                                                        {claim.website && <><a href={claim.website} target="_blank" rel="noreferrer">Sitio oficial</a>{' '}</>}
                                                        {claim.proofUrl && <a href={claim.proofUrl} target="_blank" rel="noreferrer">Evidencia</a>}
                                                        {claim.notes && <p>{claim.notes}</p>}
                                                    </td>
                                                    <td>{claim.status === 'pending' ? 'Pendiente' : claim.status === 'approved' ? 'Aprobada' : 'Rechazada'}</td>
                                                    <td className={styles.actions}>
                                                        {claim.status === 'pending' ? <>
                                                            <button disabled={workingId === claim.id} className={styles.primaryBtn} onClick={() => revisarReclamacion(claim, 'approved')}>Aprobar</button>
                                                            <button disabled={workingId === claim.id} className={styles.deleteBtn} onClick={() => revisarReclamacion(claim, 'rejected')}>Rechazar</button>
                                                        </> : <small>{claim.verificationNotes}</small>}
                                                    </td>
                                                </tr>
                                            ))}
                                            {claims.length === 0 && <tr><td colSpan={4} className={styles.emptyRow}>Sin reclamaciones.</td></tr>}
                                        </tbody>
                                    </table>
                                </section>
                            )}

                            {activeSection === 'usuarios' && (
                                <section className={styles.tableSection}>
                                    <h2>Usuarios y roles</h2>
                                    <p>Designa curadores para que ayuden a mantener el directorio, o administradores con acceso completo. Un <strong>curador</strong> puede crear y editar lugares, chefs, guías y notas; borrar, destacar y las estrellas Michelin quedan sólo para administradores.</p>
                                    <table className={styles.adminTable}>
                                        <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Cambiar rol</th></tr></thead>
                                        <tbody>
                                            {usuarios.map((u) => (
                                                <tr key={u.uid}>
                                                    <td>
                                                        <strong>{u.displayName || 'Sin nombre'}</strong>
                                                        <br /><small style={{ color: '#8a9690' }}>{u.uid.slice(0, 10)}…</small>
                                                    </td>
                                                    <td>{u.email || '—'}</td>
                                                    <td>
                                                        <span className={
                                                            u.role === 'admin' ? styles.rolAdmin
                                                            : u.role === 'curator' ? styles.rolCurador
                                                            : styles.rolNormal
                                                        }>
                                                            {u.role === 'admin' ? 'Administrador' : u.role === 'curator' ? 'Curador' : 'Usuario'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <select
                                                            value={u.role || ''}
                                                            disabled={rolCambiando === u.uid}
                                                            onChange={(e) => cambiarRol(u.uid, e.target.value)}
                                                        >
                                                            <option value="">Usuario</option>
                                                            <option value="curator">Curador</option>
                                                            <option value="admin">Administrador</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                            {usuarios.length === 0 && <tr><td colSpan={4} className={styles.emptyRow}>Todavía no hay usuarios registrados. Aparecerán aquí cuando inicien sesión.</td></tr>}
                                        </tbody>
                                    </table>
                                </section>
                            )}

                            {activeSection === 'reservas' && esAdmin && (
                                <section>
                                    <PanelReservas />
                                </section>
                            )}

                            {activeSection === 'restaurantes' && (
                                <section>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                        <h2>Lista de Restaurantes</h2>
                                        <button className={styles.primaryBtn} onClick={() => setEditingRestaurant({})}><FaPlus /> Nuevo Lugar</button>
                                    </div>

                                    <div className={styles.splitLayout}>
                                        <div className={styles.listPane}>
                                            <div className={styles.listTools}>
                                                <input
                                                    className={styles.searchInput}
                                                    value={restQuery}
                                                    onChange={e => { setRestQuery(e.target.value); setRestPage(1); }}
                                                    placeholder="Buscar por nombre, categoría o dirección…"
                                                />
                                                <span className={styles.listCount}>{filtrarRest.length} lugares</span>
                                            </div>
                                            <div className={styles.tableSection}>
                                                <table className={styles.adminTable}>
                                                    <thead>
                                                        <tr>
                                                            <th>Restaurante</th>
                                                            <th>Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {restVisibles.map(r => (
                                                            <tr key={r.id} className={editingRestaurant?.id === r.id ? styles.rowActive : undefined}>
                                                                <td>
                                                                    <div className={styles.rowMain}>{r.restaurantName || r.name}</div>
                                                                    <div className={styles.rowSub}>{r.category}</div>
                                                                </td>
                                                                <td className={styles.actions}>
                                                                    <button className={styles.editBtn} onClick={() => setEditingRestaurant(r)}><FaEdit /></button>
                                                                    {esAdmin && <button className={styles.deleteBtn} onClick={() => handleDeleteRestaurant(r.id)}><FaTrash /></button>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {restVisibles.length === 0 && (
                                                            <tr><td colSpan={2} className={styles.emptyRow}>Sin resultados para “{restQuery}”.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {restPaginas > 1 && (
                                                <div className={styles.pager}>
                                                    <button type="button" onClick={() => setRestPage(p => Math.max(1, p - 1))} disabled={restPagActual <= 1}>Anterior</button>
                                                    <span>{restPagActual} / {restPaginas}</span>
                                                    <button type="button" onClick={() => setRestPage(p => Math.min(restPaginas, p + 1))} disabled={restPagActual >= restPaginas}>Siguiente</button>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`${styles.formOuter} ${editingRestaurant ? styles.formOuterActivo : ''}`}>
                                            {editingRestaurant ? (
                                                <form onSubmit={handleSaveRestaurant} className={styles.adminForm}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <h3>{editingRestaurant.id ? "Editar Perfil" : "Nuevo Perfil"}</h3>
                                                        <button type="button" className={styles.editBtn} onClick={() => setEditingRestaurant(null)}><FaTimes /></button>
                                                    </div>
                                                    
                                                    <label>Nombre del Restaurante</label>
                                                    <input 
                                                        value={editingRestaurant.restaurantName || editingRestaurant.name || ''} 
                                                        onChange={e => setEditingRestaurant({...editingRestaurant, restaurantName: e.target.value})}
                                                        placeholder="Nombre..."
                                                    />

                                                    <div className={styles.formRow}>
                                                        <div className={styles.formRowGrow}>
                                                            <label>Categoría</label>
                                                            <input 
                                                                value={editingRestaurant.category || ''} 
                                                                onChange={e => setEditingRestaurant({...editingRestaurant, category: e.target.value})}
                                                                placeholder="Ej. Mexicana Moderna"
                                                            />
                                                        </div>
                                                        {esAdmin && (
                                                            <div className={styles.formRowNarrow}>
                                                                <label>Estrellas</label>
                                                                <input
                                                                    type="number"
                                                                    value={editingRestaurant.michelinStars || 0}
                                                                    onChange={e => setEditingRestaurant({...editingRestaurant, michelinStars: parseInt(e.target.value), isMichelin: parseInt(e.target.value) > 0})}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <GestorDeChefs
                                                        lista={chefsDelLugar(editingRestaurant)}
                                                        fichas={chefs}
                                                        onChange={siguiente => setEditingRestaurant({...editingRestaurant, chefsLista: siguiente})}
                                                    />

                                                    {esAdmin && (
                                                        <SelectorDueno
                                                            usuarios={usuarios}
                                                            valor={editingRestaurant.userId}
                                                            onChange={uid => setEditingRestaurant({...editingRestaurant, userId: uid})}
                                                        />
                                                    )}

                                                    <label className={styles.chefPrevio}>
                                                        <input type="checkbox" checked={Boolean(editingRestaurant.isTraditionalCuisine)} onChange={e => setEditingRestaurant({...editingRestaurant, isTraditionalCuisine: e.target.checked})} />
                                                        Cocina tradicional (aparece en la sección editorial)
                                                    </label>

                                                    <label>Menú del lugar</label>
                                                    <GestorDeMenu
                                                        lugarId={editingRestaurant.id}
                                                        menu={Array.isArray(editingRestaurant.menu) ? editingRestaurant.menu : []}
                                                        onChange={siguiente => setEditingRestaurant({...editingRestaurant, menu: siguiente})}
                                                    />

                                                    <label>Descripción</label>
                                                    <textarea 
                                                        value={editingRestaurant.description || ''} 
                                                        onChange={e => setEditingRestaurant({...editingRestaurant, description: e.target.value})}
                                                        rows={4}
                                                    />

                                                    <label>Imagen del Restaurante</label>
                                                    <MediaUploader 
                                                        folder="restaurants" 
                                                        onUploadComplete={(url, _tipo, tarjeta) => setEditingRestaurant({...editingRestaurant, image: url, ...(tarjeta ? { imagenTarjeta: tarjeta } : {})})} 
                                                    />
                                                    <input 
                                                        value={editingRestaurant.image || ''} 
                                                        onChange={e => setEditingRestaurant({...editingRestaurant, image: e.target.value})}
                                                        placeholder="O ingresa URL manual..."
                                                    />
                                                    {editingRestaurant.id && (
                                                        <ImageImporter
                                                            entityType="restaurant"
                                                            entityId={editingRestaurant.id}
                                                            website={editingRestaurant.website}
                                                            onImported={url => setEditingRestaurant({...editingRestaurant, image: url})}
                                                        />
                                                    )}

                                                    <label>Dirección</label>
                                                    <input 
                                                        value={editingRestaurant.address || ''} 
                                                        onChange={e => setEditingRestaurant({...editingRestaurant, address: e.target.value})}
                                                    />

                                                    <label>Subdominio / URL de Menú (ej: pujol)</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <input 
                                                            value={editingRestaurant.subdomain?.split('.')[0] || ''} 
                                                            onChange={e => setEditingRestaurant({...editingRestaurant, subdomain: `${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${APP_DOMAIN}`})}
                                                            placeholder="ej: nombre-restaurante"
                                                            style={{ flex: 1 }}
                                                        />
                                                        <span style={{ fontSize: '0.9rem', color: '#888' }}>.{APP_DOMAIN}</span>
                                                    </div>

                                                    <div className={styles.formRow}>
                                                        <div className={styles.formRowGrow}>
                                                            <label>Latitud</label>
                                                            <input 
                                                                type="number" step="any"
                                                                value={editingRestaurant.lat || ''} 
                                                                onChange={e => setEditingRestaurant({...editingRestaurant, lat: parseFloat(e.target.value)})}
                                                            />
                                                        </div>
                                                        <div className={styles.formRowGrow}>
                                                            <label>Longitud</label>
                                                            <input 
                                                                type="number" step="any"
                                                                value={editingRestaurant.lng || ''} 
                                                                onChange={e => setEditingRestaurant({...editingRestaurant, lng: parseFloat(e.target.value)})}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Contacto y Redes Sociales */}
                                                    <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', padding: '1.2rem', background: '#f8fbf8', borderRadius: '8px', border: '1px solid #dbe8db' }}>
                                                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#16884d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            Contacto y Redes Sociales
                                                        </h4>

                                                        <div className={styles.formRow}>
                                                            <div className={styles.formRowGrow}>
                                                                <label>Teléfono</label>
                                                                <input
                                                                    value={editingRestaurant.phone || ''}
                                                                    onChange={e => setEditingRestaurant({...editingRestaurant, phone: e.target.value})}
                                                                    placeholder="+52 55 1234 5678"
                                                                />
                                                            </div>
                                                            <div className={styles.formRowGrow}>
                                                                <label>Sitio Web Oficial</label>
                                                                <input
                                                                    value={editingRestaurant.website || ''}
                                                                    onChange={e => setEditingRestaurant({...editingRestaurant, website: e.target.value})}
                                                                    placeholder="https://..."
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className={styles.formRow}>
                                                            <div className={styles.formRowGrow}>
                                                                <label>Instagram</label>
                                                                <input
                                                                    value={editingRestaurant.socials?.instagram || editingRestaurant.instagram || ''}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        setEditingRestaurant({
                                                                            ...editingRestaurant,
                                                                            instagram: val,
                                                                            socials: { ...(editingRestaurant.socials || {}), instagram: val }
                                                                        });
                                                                    }}
                                                                    placeholder="https://www.instagram.com/les___batardsmx"
                                                                />
                                                            </div>
                                                            <div className={styles.formRowGrow}>
                                                                <label>TikTok</label>
                                                                <input
                                                                    value={editingRestaurant.socials?.tiktok || editingRestaurant.tiktok || ''}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        setEditingRestaurant({
                                                                            ...editingRestaurant,
                                                                            tiktok: val,
                                                                            socials: { ...(editingRestaurant.socials || {}), tiktok: val }
                                                                        });
                                                                    }}
                                                                    placeholder="https://www.tiktok.com/@usuario"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className={styles.formRow}>
                                                            <div className={styles.formRowGrow}>
                                                                <label>Facebook</label>
                                                                <input
                                                                    value={editingRestaurant.socials?.facebook || editingRestaurant.facebook || ''}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        setEditingRestaurant({
                                                                            ...editingRestaurant,
                                                                            facebook: val,
                                                                            socials: { ...(editingRestaurant.socials || {}), facebook: val }
                                                                        });
                                                                    }}
                                                                    placeholder="https://www.facebook.com/pagina"
                                                                />
                                                            </div>
                                                            <div className={styles.formRowGrow}>
                                                                <label>Twitter / X</label>
                                                                <input
                                                                    value={editingRestaurant.socials?.twitter || editingRestaurant.twitter || ''}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        setEditingRestaurant({
                                                                            ...editingRestaurant,
                                                                            twitter: val,
                                                                            socials: { ...(editingRestaurant.socials || {}), twitter: val }
                                                                        });
                                                                    }}
                                                                    placeholder="https://x.com/usuario"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div style={{ marginTop: '1rem' }}>
                                                            <label>Videos y publicaciones (una URL por línea)</label>
                                                            <textarea
                                                                value={(editingRestaurant.socialVideos || []).map((video: any) => typeof video === 'string' ? video : video.url).filter(Boolean).join('\n')}
                                                                onChange={e => setEditingRestaurant({
                                                                    ...editingRestaurant,
                                                                    socialVideos: e.target.value.split('\n').map(url => url.trim()).filter(Boolean)
                                                                })}
                                                                placeholder={'https://www.instagram.com/reel/...\nhttps://www.tiktok.com/@usuario/video/...\nhttps://.../video.mp4'}
                                                                rows={5}
                                                            />
                                                            <small style={{ display: 'block', marginTop: '0.45rem', color: '#607068' }}>
                                                                Acepta publicaciones de Instagram, TikTok y Facebook, o enlaces directos MP4. Se reproducen dentro de Come.
                                                            </small>
                                                        </div>
                                                    </div>

                                                    {editingRestaurant.id && (
                                                        <div style={{ marginTop: '1.5rem' }}>
                                                            <label>Feed automático de redes</label>
                                                            <SocialConnections
                                                                entityId={editingRestaurant.id}
                                                                entityType="restaurant"
                                                                status={editingRestaurant.socialStatus || {}}
                                                            />
                                                        </div>
                                                    )}

                                                    <button type="submit" className={`${styles.primaryBtn} ${styles.stickySave}`}>
                                                        <FaSave /> Guardar Cambios
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className={styles.emptyState}>
                                                    <FaUtensils size={40} />
                                                    <p>Selecciona un restaurante para editar o crea uno nuevo.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeSection === 'chefs' && (
                                <section>
                                    <div className={styles.sectionHead}>
                                        <h2>Directorio de chefs</h2>
                                        <button className={styles.primaryBtn} onClick={() => setEditingChef({})}><FaPlus /> Nuevo chef</button>
                                    </div>

                                    <div className={styles.splitLayout}>
                                        <div className={styles.listPane}>
                                            <div className={styles.listTools}>
                                                <input
                                                    className={styles.searchInput}
                                                    value={chefQuery}
                                                    onChange={e => { setChefQuery(e.target.value); setChefPage(1); }}
                                                    placeholder="Buscar por nombre, especialidad o lugar…"
                                                />
                                                <span className={styles.listCount}>{filtrarChefs.length} chefs</span>
                                            </div>
                                            <div className={styles.tableSection}>
                                                <table className={styles.adminTable}>
                                                    <thead>
                                                        <tr>
                                                            <th>Chef</th>
                                                            <th>Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {chefVisibles.map(chef => (
                                                            <tr key={chef.id} className={editingChef?.id === chef.id ? styles.rowActive : undefined}>
                                                                <td>
                                                                    <div className={styles.rowMain}>{chef.name || "Sin nombre"}</div>
                                                                    <div className={styles.rowSub}>
                                                                        {[chef.specialty, chef.restaurant, chef.ubicacion].filter(Boolean).join(" · ") || "Sin datos"}
                                                                    </div>
                                                                </td>
                                                                <td className={styles.actions}>
                                                                    <button className={styles.editBtn} onClick={() => setEditingChef(chef)}><FaEdit /></button>
                                                                    {esAdmin && <button className={styles.deleteBtn} onClick={() => handleDeleteChef(chef.id)}><FaTrash /></button>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {chefVisibles.length === 0 && (
                                                            <tr><td colSpan={2} className={styles.emptyRow}>Sin resultados para “{chefQuery}”.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {chefPaginas > 1 && (
                                                <div className={styles.pager}>
                                                    <button type="button" onClick={() => setChefPage(p => Math.max(1, p - 1))} disabled={chefPagActual <= 1}>Anterior</button>
                                                    <span>{chefPagActual} / {chefPaginas}</span>
                                                    <button type="button" onClick={() => setChefPage(p => Math.min(chefPaginas, p + 1))} disabled={chefPagActual >= chefPaginas}>Siguiente</button>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`${styles.formOuter} ${editingChef ? styles.formOuterActivo : ''}`}>
                                            {editingChef ? (
                                                <form onSubmit={handleSaveChef} className={styles.adminForm}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <h3>{editingChef.id ? "Editar Chef" : "Nuevo Chef"}</h3>
                                                        <button type="button" className={styles.editBtn} onClick={() => setEditingChef(null)}><FaTimes /></button>
                                                    </div>
                                                    
                                                    <label>Nombre Completo</label>
                                                    <input 
                                                        value={editingChef.name || ''} 
                                                        onChange={e => setEditingChef({...editingChef, name: e.target.value})}
                                                    />

                                                    <label>Especialidad</label>
                                                    <input
                                                        placeholder="Ej. Oaxaqueña tradicional"
                                                        value={editingChef.specialty || ''}
                                                        onChange={e => setEditingChef({...editingChef, specialty: e.target.value})}
                                                    />

                                                    <label>Restaurante principal</label>
                                                    <input 
                                                        value={editingChef.restaurant || ''} 
                                                        onChange={e => setEditingChef({...editingChef, restaurant: e.target.value})}
                                                    />

                                                    <div className={styles.formRow}>
                                                        <div className={styles.formRowGrow}>
                                                            <label>Ubicación</label>
                                                            <input 
                                                                value={editingChef.ubicacion || ''} 
                                                                onChange={e => setEditingChef({...editingChef, ubicacion: e.target.value})}
                                                            />
                                                        </div>
                                                        {esAdmin && (
                                                            <div style={{ width: '100px' }}>
                                                                <label>Estrellas</label>
                                                                <input
                                                                    type="number"
                                                                    value={editingChef.estrellas || 0}
                                                                    onChange={e => setEditingChef({...editingChef, estrellas: Number(e.target.value) || 0})}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <label>Biografía Corta</label>
                                                    <textarea 
                                                        value={editingChef.bio || ''} 
                                                        onChange={e => setEditingChef({...editingChef, bio: e.target.value})}
                                                        rows={3}
                                                    />

                                                    <label>Imagen del Chef</label>
                                                    <MediaUploader 
                                                        folder="chefs" 
                                                        onUploadComplete={(url, _tipo, tarjeta) => setEditingChef({...editingChef, image: url, ...(tarjeta ? { imagenTarjeta: tarjeta } : {})})} 
                                                    />
                                                    <input 
                                                        value={editingChef.image || ''} 
                                                        onChange={e => setEditingChef({...editingChef, image: e.target.value})}
                                                        placeholder="URL de la foto..."
                                                    />

                                                    <label>Sitio web oficial</label>
                                                    <input
                                                        value={editingChef.website || ''}
                                                        onChange={e => setEditingChef({...editingChef, website: e.target.value})}
                                                        placeholder="https://..."
                                                    />
                                                    {editingChef.id && (
                                                        <ImageImporter
                                                            entityType="chef"
                                                            entityId={editingChef.id}
                                                            website={editingChef.website}
                                                            onImported={url => setEditingChef({...editingChef, image: url})}
                                                        />
                                                    )}

                                                    <label>Redes Sociales</label>
                                                    <input 
                                                        value={editingChef.redes || ''} 
                                                        onChange={e => setEditingChef({...editingChef, redes: e.target.value})}
                                                        placeholder="@usuario"
                                                    />

                                                    {esAdmin && (
                                                        <SelectorDueno
                                                            usuarios={usuarios}
                                                            valor={editingChef.userId}
                                                            onChange={uid => setEditingChef({...editingChef, userId: uid})}
                                                        />
                                                    )}
                                                    <label className={styles.chefPrevio}>
                                                        <input type="checkbox" checked={Boolean(editingChef.isTraditionalCook)} onChange={e => setEditingChef({...editingChef, isTraditionalCook: e.target.checked})} />
                                                        Cocinera tradicional (aparece en su directorio propio)
                                                    </label>

                                                    {editingChef.id && (
                                                        <div style={{ marginTop: '1.5rem' }}>
                                                            <label>Feed automático de redes</label>
                                                            <SocialConnections entityId={editingChef.id} entityType="chef" status={editingChef.socialStatus || {}} />
                                                        </div>
                                                    )}

                                                    <button type="submit" className={`${styles.primaryBtn} ${styles.stickySave}`}>
                                                        <FaSave /> Guardar Chef
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className={styles.emptyState}>
                                                    <FaUsers size={40} />
                                                    <p>Selecciona un chef para editar o crea uno nuevo.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                             {activeSection === 'guias' && (
                                <section>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                        <h2>Gestión de Guías</h2>
                                        <button className={styles.primaryBtn} onClick={() => setEditingGuide({ title: '', description: '', stops: [], restaurantIds: [] })}><FaPlus /> Nueva Guía</button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <div className={styles.tableSection}>
                                            <table className={styles.adminTable}>
                                                <thead>
                                                    <tr>
                                                        <th>Guía</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {guides.map(guide => (
                                                        <tr key={guide.id} style={{ background: editingGuide?.id === guide.id ? '#f0f7ff' : 'transparent' }}>
                                                            <td>
                                                                <div style={{ fontWeight: 700 }}>{guide.title}</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>{guide.stops?.length || 0} paradas / {guide.status}</div>
                                                            </td>
                                                            <td className={styles.actions}>
                                                                <button className={styles.editBtn} onClick={() => setEditingGuide(guide)}><FaEdit /></button>
                                                                {esAdmin && <button className={styles.deleteBtn} onClick={() => handleDeleteGuide(guide.id)}><FaTrash /></button>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className={styles.formOuter}>
                                            {editingGuide ? (
                                                <form onSubmit={handleSaveGuide} className={styles.adminForm}>
                                                    <h3>{editingGuide.id ? "Editar Guía" : "Nueva Guía"}</h3>
                                                    
                                                    <label>Título de la Guía</label>
                                                    <input 
                                                        value={editingGuide.title || ''} 
                                                        onChange={e => setEditingGuide({...editingGuide, title: e.target.value})}
                                                    />

                                                    <label>Imagen de Portada (Hero)</label>
                                                    <MediaUploader 
                                                        folder="guides" 
                                                        onUploadComplete={(url) => setEditingGuide({...editingGuide, heroImage: url})} 
                                                    />
                                                    <input 
                                                        value={editingGuide.heroImage || ''} 
                                                        onChange={e => setEditingGuide({...editingGuide, heroImage: e.target.value})}
                                                        placeholder="URL de la imagen..."
                                                    />

                                                    <label>Descripción</label>
                                                    <textarea 
                                                        value={editingGuide.description || ''} 
                                                        onChange={e => setEditingGuide({...editingGuide, description: e.target.value})}
                                                        rows={3}
                                                    />

                                                    <label>Autor</label>
                                                    <input 
                                                        value={editingGuide.authorName || 'Admin'} 
                                                        onChange={e => setEditingGuide({...editingGuide, authorName: e.target.value})}
                                                    />

                                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                                                        <h4 style={{ marginBottom: '1rem' }}>Paradas ({editingGuide.stops?.length || 0})</h4>
                                                        <button 
                                                            type="button" 
                                                            className={styles.editBtn}
                                                            onClick={() => {
                                                                const newStop = { id: Date.now().toString(), title: '', content: '', order: (editingGuide.stops?.length || 0) + 1, location: { lat: 0, lng: -99.1332, name: '', address: '' } };
                                                                setEditingGuide({...editingGuide, stops: [...(editingGuide.stops || []), newStop]});
                                                            }}
                                                        >
                                                            <FaPlus /> Agregar Parada
                                                        </button>
                                                        
                                                        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                                                            * El editor avanzado de paradas y mapas proximamente. Use el JSON para edición manual avanzada.
                                                        </p>
                                                    </div>

                                                    <button type="submit" className={styles.primaryBtn} style={{ marginTop: '2rem' }}>
                                                        <FaSave /> Guardar Guía
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className={styles.emptyState}>
                                                    <FaMapMarkerAlt size={40} />
                                                    <p>Selecciona una guía para editar o crea una nueva.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                        </>
                    )}
                </main>
            </div>
            <style jsx>{`
                label { font-size: 0.8rem; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: -1rem; }
                .formOuter { background: #fff; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .${styles.spin} { animation: spin 1s linear infinite; }
            `}</style>
        </AdminGuard>
    );
}
