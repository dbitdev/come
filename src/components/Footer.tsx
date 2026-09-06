import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";
import styles from "./Footer.module.css";

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
            {/* El QR apunta a comeapp.com.mx/ordenar; cámbialo por el enlace de la
                ficha en las tiendas cuando la app esté publicada. */}
            <img src="/qr-app.svg" alt="Código QR para abrir Come en tu teléfono" />
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
              <Link href="/terminos">Aviso de privacidad</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
