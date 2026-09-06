import Link from "next/link";
import styles from "../static-pages.module.css";

const ACTUALIZADO = "5 de septiembre de 2026";
const CONTACTO = "legal@comeapp.com.mx";

const INDICE = [
  ["quienes-somos", "1. Quiénes somos"],
  ["que-es-come", "2. Qué es Come (y qué no es)"],
  ["tu-cuenta", "3. Tu cuenta"],
  ["contenido-que-envias", "4. Contenido que nos envías"],
  ["negocios", "5. Registro y gestión de negocios"],
  ["uso-permitido", "6. Uso permitido y conductas prohibidas"],
  ["propiedad-intelectual", "7. Propiedad intelectual"],
  ["terceros", "8. Contenidos y servicios de terceros"],
  ["ubicacion", "9. Ubicación y mapas"],
  ["disponibilidad", "10. Disponibilidad y cambios del servicio"],
  ["responsabilidad", "11. Exención y límite de responsabilidad"],
  ["app", "12. Aplicación móvil"],
  ["privacidad", "13. Privacidad"],
  ["cambios", "14. Cambios a estos términos"],
  ["ley-aplicable", "15. Ley aplicable y jurisdicción"],
  ["contacto", "16. Contacto"],
];

export default function Terminos() {
  return (
    <main className={styles.page}>
      <section className={`${styles.hero} ${styles.yellow}`}>
        <div>
          <span className={styles.eyebrow}>INFORMACIÓN LEGAL</span>
          <h1>Términos y condiciones</h1>
          <p>Última actualización: {ACTUALIZADO}.</p>
        </div>
      </section>

      <article className={`${styles.content} ${styles.legal}`}>
        <div className={styles.summary}>
          <h2>En corto</h2>
          <ul>
            <li>Come es una guía gastronómica editorial: publicamos información sobre restaurantes, chefs y rutas para comer en México.</li>
            <li>No vendemos comida, no procesamos pagos y no hacemos entregas. Cuando pides algo, lo haces directamente con el restaurante.</li>
            <li>Lo que nos envías —nominaciones, la ficha de tu negocio— pasa por revisión de la redacción antes de publicarse.</li>
            <li>Horarios, precios y menús cambian: confírmalos con el lugar antes de ir.</li>
          </ul>
          <p>Este resumen es sólo una guía de lectura; lo que obliga es el texto completo.</p>
        </div>

        <nav className={styles.toc} aria-label="Índice de los términos">
          <b>CONTENIDO</b>
          <ol>
            {INDICE.map(([id, titulo]) => (
              <li key={id}><a href={`#${id}`}>{titulo}</a></li>
            ))}
          </ol>
        </nav>

        <h2 id="quienes-somos">1. Quiénes somos</h2>
        <p>
          Come es una plataforma operada por Mexica Gourmet (&laquo;Come&raquo;, &laquo;nosotros&raquo;), disponible en
          comeapp.com.mx y en la aplicación móvil Come. Estos términos rigen el uso del sitio web, de la app y de
          cualquier servicio que ofrezcamos a través de ellos.
        </p>
        <p>
          Al acceder o usar Come aceptas estos términos. Si no estás de acuerdo con ellos, no uses la plataforma.
        </p>

        <h2 id="que-es-come">2. Qué es Come (y qué no es)</h2>
        <p>
          Come es una guía gastronómica: un directorio curado de restaurantes y chefs, guías y rutas para salir a comer,
          un mapa de lugares cercanos y contenido editorial sobre cocina mexicana. La selección y la redacción son
          nuestras, y los lugares no pagan por aparecer.
        </p>
        <p>Para que quede claro qué no hacemos:</p>
        <ul>
          <li>No somos un restaurante ni un servicio de comida. No preparamos, vendemos ni entregamos alimentos.</li>
          <li>No procesamos pagos ni cobramos comisiones por pedidos. Los menús que publicamos son informativos.</li>
          <li>No somos intermediarios ni representantes de los negocios que aparecen en la plataforma. Cualquier
            pedido, reservación, consumo o reclamación ocurre entre tú y el establecimiento.</li>
          <li>No garantizamos disponibilidad de mesas, de platillos ni de servicio a domicilio.</li>
        </ul>
        <p>
          La información de cada lugar —horarios, precios, dirección, menú, reconocimientos— proviene del propio
          negocio, de fuentes públicas o de nuestra investigación editorial, y puede quedar desactualizada. Verifícala
          con el establecimiento antes de trasladarte o consumir, especialmente si tienes alergias, intolerancias o
          restricciones alimentarias: no podemos garantizar la exactitud de ingredientes ni la ausencia de alérgenos.
        </p>

        <h2 id="tu-cuenta">3. Tu cuenta</h2>
        <p>
          Puedes explorar Come sin cuenta. Necesitas registrarte para guardar tu perfil y para registrar o gestionar un
          negocio. La cuenta se crea con correo y contraseña, o accediendo con Google o con Apple.
        </p>
        <ul>
          <li>Debes ser mayor de edad para crear una cuenta. Come no está dirigido a menores de 18 años.</li>
          <li>Los datos que registres deben ser verdaderos y estar actualizados.</li>
          <li>Eres responsable de tu contraseña y de la actividad realizada desde tu cuenta. Avísanos en cuanto
            detectes un uso no autorizado.</li>
          <li>Puedes cerrar tu cuenta cuando quieras: los pasos están en{" "}
            <Link href="/eliminar-cuenta">eliminar tu cuenta</Link>.</li>
          <li>Podemos suspender o cancelar una cuenta que incumpla estos términos, que publique información falsa o que
            afecte la seguridad de la plataforma.</li>
        </ul>

        <h2 id="contenido-que-envias">4. Contenido que nos envías</h2>
        <p>
          Cuando nominas un lugar o un chef, registras un negocio o nos mandas textos, fotografías, enlaces o menús,
          ese material sigue siendo tuyo. Al enviarlo nos otorgas una licencia no exclusiva, mundial, gratuita y
          transferible para reproducirlo, adaptarlo, traducirlo, editarlo y publicarlo en Come y en nuestros canales de
          difusión, mientras el contenido siga publicado.
        </p>
        <p>Al enviar contenido declaras que:</p>
        <ul>
          <li>Eres su titular o cuentas con los permisos necesarios, incluidos los derechos sobre las fotografías y el
            consentimiento de las personas que aparezcan en ellas.</li>
          <li>La información es veraz y no induce a error.</li>
          <li>No infringe derechos de terceros ni la ley aplicable.</li>
        </ul>
        <p>
          Toda nominación y todo registro pasan por revisión editorial: recibirlos no obliga a publicarlos. Podemos
          editar, no publicar o retirar cualquier contenido, en cualquier momento y sin previo aviso, cuando lo
          consideremos incorrecto, incompleto, engañoso o contrario a estos términos.
        </p>

        <h2 id="negocios">5. Registro y gestión de negocios</h2>
        <p>Si registras un establecimiento en Come:</p>
        <ul>
          <li>Declaras que estás autorizado para representarlo.</li>
          <li>Te comprometes a mantener actualizados sus datos de contacto, horarios, menú y precios.</li>
          <li>Aceptas que la ficha se publica sólo después de la revisión de la redacción, y que su presentación
            editorial —textos, categorías, orden en los listados— corresponde a Come.</li>
          <li>Nos autorizas a mostrar la información del negocio en el sitio, en la app, en el mapa y en los materiales
            de difusión de la plataforma.</li>
          <li>Aceptas que podemos retirar o suspender la ficha si detectamos información falsa, si el establecimiento
            cierra o si el uso de la plataforma incumple estos términos.</li>
        </ul>
        <p>
          El registro y la aparición en el directorio son gratuitos. Si en el futuro ofrecemos servicios de pago, sus
          condiciones se informarán por separado antes de contratarlos.
        </p>

        <h2 id="uso-permitido">6. Uso permitido y conductas prohibidas</h2>
        <p>
          Puedes usar Come para consultar, compartir enlaces y participar con nominaciones o con el registro de tu
          negocio. No está permitido:
        </p>
        <ul>
          <li>Extraer masivamente el contenido del directorio mediante scraping, robots o cualquier método automatizado,
            ni reproducir bases de datos completas.</li>
          <li>Usar el contenido con fines comerciales sin nuestra autorización escrita.</li>
          <li>Suplantar a una persona, a un chef o a un establecimiento, o enviar reseñas y nominaciones falsas.</li>
          <li>Publicar contenido ilícito, difamatorio, discriminatorio o que invada la privacidad de terceros.</li>
          <li>Intentar vulnerar la seguridad de la plataforma, acceder a datos ajenos o interferir con su
            funcionamiento.</li>
          <li>Introducir código malicioso o sobrecargar deliberadamente nuestros servicios.</li>
        </ul>

        <h2 id="propiedad-intelectual">7. Propiedad intelectual</h2>
        <p>
          El contenido editorial, las guías, los textos de las fichas, la selección y organización del directorio, la
          marca Come, sus logotipos, el diseño y el software pertenecen a Mexica Gourmet o a sus licenciantes, y están
          protegidos por la legislación mexicana e internacional en materia de derechos de autor y propiedad
          industrial.
        </p>
        <p>
          Puedes consultar y compartir enlaces a nuestro contenido, citando la fuente. Cualquier otro uso
          —reproducción, distribución, traducción o creación de obras derivadas— requiere autorización previa por
          escrito.
        </p>
        <p>
          Los nombres, logotipos y fotografías de restaurantes y chefs pertenecen a sus titulares y se usan con fines
          informativos y editoriales. Si eres titular de un derecho y consideras que un contenido publicado lo
          infringe, escríbenos a {CONTACTO} indicando el contenido, su ubicación y el fundamento de tu reclamación;
          lo revisaremos y, si procede, lo retiraremos.
        </p>

        <h2 id="terceros">8. Contenidos y servicios de terceros</h2>
        <p>
          Come se apoya en servicios de terceros y enlaza a sitios que no controlamos: Google Maps para los mapas y la
          búsqueda de direcciones, Firebase de Google para el alojamiento, la autenticación y la base de datos, Apple
          y Google para el acceso con cuenta, nuestro sistema editorial para las historias, y las páginas y redes
          sociales de los establecimientos.
        </p>
        <p>
          No respondemos por el contenido, las políticas ni el funcionamiento de esos servicios. Al usarlos, se aplican
          además sus propios términos y avisos de privacidad.
        </p>

        <h2 id="ubicacion">9. Ubicación y mapas</h2>
        <p>
          Si nos autorizas a usar tu ubicación, la empleamos para mostrarte lugares cercanos y calcular distancias
          aproximadas. La dirección que guardas se almacena en tu propio dispositivo y puedes borrarla cuando quieras.
          Nunca es obligatorio compartir la ubicación: el resto de la plataforma funciona sin ella.
        </p>
        <p>
          Las distancias y las posiciones en el mapa son estimaciones y pueden no coincidir con la ubicación real del
          establecimiento. Detalles sobre el tratamiento de estos datos en el <Link href="/privacidad">aviso de
          privacidad</Link>.
        </p>

        <h2 id="disponibilidad">10. Disponibilidad y cambios del servicio</h2>
        <p>
          Trabajamos para mantener Come disponible, pero no garantizamos un funcionamiento ininterrumpido ni libre de
          errores. Podemos modificar, suspender o descontinuar funciones, secciones o la plataforma completa, así como
          realizar tareas de mantenimiento que interrumpan el servicio temporalmente.
        </p>

        <h2 id="responsabilidad">11. Exención y límite de responsabilidad</h2>
        <p>
          Come se ofrece &laquo;tal cual&raquo;, con la información disponible al momento de la publicación. En la
          medida que permita la ley aplicable, no respondemos por:
        </p>
        <ul>
          <li>La exactitud, vigencia o integridad de horarios, precios, menús, ingredientes o reconocimientos.</li>
          <li>La calidad, higiene, seguridad o legalidad de los productos y servicios de los establecimientos
            publicados.</li>
          <li>Los daños derivados de tu relación con un restaurante, chef, proveedor o anunciante.</li>
          <li>Las pérdidas causadas por interrupciones, fallas técnicas o pérdida de datos.</li>
          <li>Los daños indirectos, incidentales o lucro cesante.</li>
        </ul>
        <p>
          Nada en estos términos excluye la responsabilidad que no pueda limitarse conforme a la legislación mexicana,
          incluida la protección al consumidor.
        </p>

        <h2 id="app">12. Aplicación móvil</h2>
        <p>
          La app de Come se descarga desde las tiendas de aplicaciones y su uso queda sujeto además a los términos de
          la tienda correspondiente. Te concedemos una licencia personal, limitada, revocable y no transferible para
          instalarla y usarla en tus dispositivos. No puedes copiarla, modificarla, descompilarla ni distribuirla.
        </p>
        <p>
          Las actualizaciones pueden instalarse automáticamente según la configuración de tu dispositivo. La descarga
          es gratuita; el consumo de datos móviles corre por tu cuenta.
        </p>

        <h2 id="privacidad">13. Privacidad</h2>
        <p>
          El tratamiento de tus datos personales se rige por nuestro <Link href="/privacidad">aviso de privacidad</Link>,
          que forma parte de estos términos y explica qué datos recabamos, para qué los usamos y cómo ejercer tus
          derechos ARCO. Si quieres cerrar tu cuenta, el procedimiento está en{" "}
          <Link href="/eliminar-cuenta">eliminar tu cuenta</Link>.
        </p>

        <h2 id="cambios">14. Cambios a estos términos</h2>
        <p>
          Podemos actualizar estos términos para reflejar cambios en la plataforma o en la normativa. La versión
          vigente es siempre la publicada en esta página, con su fecha de última actualización. Si el cambio es
          relevante, lo anunciaremos en el sitio o por correo. Seguir usando Come después de la publicación implica que
          aceptas la versión actualizada.
        </p>

        <h2 id="ley-aplicable">15. Ley aplicable y jurisdicción</h2>
        <p>
          Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las
          partes se someten a los tribunales competentes de la Ciudad de México, renunciando a cualquier otro fuero que
          pudiera corresponderles por razón de domicilio presente o futuro.
        </p>
        <p>
          Si alguna cláusula resulta inválida o inexigible, las demás continuarán en vigor.
        </p>

        <h2 id="contacto">16. Contacto</h2>
        <p>Para consultas legales, reclamaciones de contenido o solicitudes sobre tu cuenta:</p>
        <div className={styles.contactBox}>
          <p><b>Come · Mexica Gourmet</b></p>
          <p>Correo: <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a></p>
          <p>Sitio: comeapp.com.mx</p>
        </div>

        <div className={styles.actions}>
          <Link href="/">Volver al inicio</Link>
          <Link href="/privacidad">Aviso de privacidad</Link>
        </div>
      </article>
    </main>
  );
}
