import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import styles from "./Footer.module.css";

// Fichas en las tiendas. La de Apple ya existe (la app está en revisión); la de
// Google responde 404 hasta que se publique, pero es la dirección definitiva y
// no hay que volver a tocarla.
const ENLACE_APP_STORE = "https://apps.apple.com/mx/app/id6809052402";
const ENLACE_GOOGLE_PLAY = "https://play.google.com/store/apps/details?id=com.mxica.come";

const ciudades = [
  "Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Querétaro",
  "Mérida", "Oaxaca", "Tijuana", "León", "Toluca",
  "Cancún", "Playa del Carmen", "San Luis Potosí", "Morelia", "Veracruz",
  "Aguascalientes", "Puerto Vallarta", "San Miguel de Allende", "Hermosillo", "Culiacán",
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.cols}>
          <div>
            <b>SOBRE COME</b>
            <Link href="/restaurantes">Restaurantes</Link>
            <Link href="/cocina-tradicional">Cocina tradicional</Link>
            <Link href="/guias">Guías y rutas</Link>
            <Link href="/chefs">Chefs</Link>
            <Link href="/mapa">Mapa</Link>
            <Link href="/noticias">Historias</Link>
            <Link href="/nosotros">Nosotros</Link>
          </div>
          <div>
            <b>PARTICIPA</b>
            <Link href="/nomina-lugar">Nomina un lugar</Link>
            <Link href="/nomina-chef">Nomina un chef</Link>
            <Link href="/registra-negocio">Registra tu negocio</Link>
            <Link href="/gestiona-negocio">Gestiona tu negocio</Link>
            <Link href="/empleos">Empleos</Link>
            <Link href="/login">Iniciar sesión</Link>
          </div>
        </div>

        <div className={styles.ciudades}>
          <b>CIUDADES</b>
          <ul>
            {ciudades.map((ciudad) => (
              <li key={ciudad}>
                <Link href={`/restaurantes?location=${encodeURIComponent(ciudad)}`}>{ciudad}</Link>
              </li>
            ))}
            <li><Link href="/mapa" className={styles.verMas}>Ver más</Link></li>
          </ul>
        </div>

        <div className={styles.aside}>
          <div className={styles.appCard}>
            <div>
              <h3>Descarga la app de Come</h3>
              <p>Sigue tu pedido, guarda tus lugares y recibe recomendaciones hechas para tu antojo.</p>
            </div>
            {/* En escritorio el QR tiene sentido: se escanea con el teléfono. En el
                teléfono no sirve para nada, así que ahí van los badges de las
                tiendas. Se pintan los dos y el CSS enseña el que toca. */}
            <img className={styles.qr} src="/qr-app.svg" alt="Código QR para abrir Come en tu teléfono" />
            <div className={styles.tiendas}>
              <a href={ENLACE_APP_STORE} aria-label="Descargar Come en el App Store">
                <img src="/badges/app-store-es.svg" alt="Descárgala en el App Store" />
              </a>
              <a href={ENLACE_GOOGLE_PLAY} aria-label="Descargar Come en Google Play">
                <img src="/badges/google-play-es.png" alt="Disponible en Google Play" />
              </a>
            </div>
          </div>

          <div className={styles.legal}>
            <span className={styles.brand}>come</span>
            {/* TODO: sustituir por los perfiles reales de Come. */}
            <div className={styles.social}>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="Facebook"><FaFacebookF /></a>
              <a href="#" aria-label="TikTok"><FaTiktok /></a>
            </div>
            <p>© {new Date().getFullYear()} Come · Mexica Gourmet</p>
            <div className={styles.legalLinks}>
              <Link href="/terminos">Términos y condiciones</Link>
              <Link href="/privacidad">Aviso de privacidad</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
