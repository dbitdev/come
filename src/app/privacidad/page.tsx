import Link from "next/link";
import styles from "../static-pages.module.css";

const ACTUALIZADO = "5 de septiembre de 2026";
const CONTACTO = "legal@comeapp.com.mx";

const INDICE = [
  ["responsable", "1. Quién es responsable de tus datos"],
  ["datos", "2. Qué datos recabamos"],
  ["finalidades", "3. Para qué los usamos"],
  ["sensibles", "4. Datos sensibles y menores de edad"],
  ["ubicacion", "5. Ubicación"],
  ["cookies", "6. Cookies y almacenamiento local"],
  ["terceros", "7. Con quién los compartimos"],
  ["transferencias", "8. Transferencias fuera de México"],
  ["conservacion", "9. Cuánto tiempo los conservamos"],
  ["seguridad", "10. Seguridad"],
  ["arco", "11. Tus derechos ARCO"],
  ["revocacion", "12. Revocar tu consentimiento"],
  ["eliminar-cuenta", "13. Eliminar tu cuenta"],
  ["limitacion", "14. Limitar el uso y la divulgación"],
  ["cambios", "15. Cambios a este aviso"],
  ["autoridad", "16. Autoridad en materia de datos personales"],
  ["contacto", "17. Contacto"],
];

// Cada fila corresponde a datos que la plataforma realmente recaba hoy:
// Firebase Auth (cuenta), Firestore (`come`, `place_nominations`,
// `chef_nominations`) y el almacenamiento local de la ubicación.
const DATOS = [
  {
    dato: "Datos de identificación",
    detalle: "Nombre o nombre para mostrar, correo electrónico y, si accedes con Google o Apple, el identificador y la foto de perfil que esos servicios nos comparten.",
    cuando: "Al crear tu cuenta o iniciar sesión.",
  },
  {
    dato: "Credenciales de acceso",
    detalle: "Tu contraseña, cifrada y gestionada por Firebase Authentication. Come nunca la ve ni la almacena en claro.",
    cuando: "Al registrarte con correo y contraseña.",
  },
  {
    dato: "Datos de tu negocio",
    detalle: "Nombre del establecimiento, categoría, dirección, teléfono, correo de contacto, horarios, reconocimientos y menú con precios.",
    cuando: "Al registrar o gestionar un negocio.",
  },
  {
    dato: "Contenido que envías",
    detalle: "Información del lugar o del chef que nominas: nombre, especialidad, semblanza, dirección, redes sociales y enlaces a fotografías.",
    cuando: "Al enviar una nominación.",
  },
  {
    dato: "Ubicación aproximada",
    detalle: "Coordenadas y dirección que eliges o que autorizas obtener del dispositivo, para ordenar los lugares por cercanía.",
    cuando: "Sólo si concedes el permiso o escribes una dirección.",
  },
  {
    dato: "Datos técnicos",
    detalle: "Dirección IP, tipo de dispositivo y navegador, y registros de errores que generan nuestros proveedores de alojamiento por razones de seguridad y operación.",
    cuando: "Al navegar el sitio o usar la app.",
  },
];

export default function Privacidad() {
  return (
    <main className={styles.page}>
      <section className={`${styles.hero} ${styles.yellow}`}>
        <div>
          <span className={styles.eyebrow}>INFORMACIÓN LEGAL</span>
          <h1>Aviso de privacidad</h1>
          <p>Última actualización: {ACTUALIZADO}.</p>
        </div>
      </section>

      <article className={`${styles.content} ${styles.legal}`}>
        <div className={styles.summary}>
          <h2>En corto</h2>
          <ul>
            <li>Puedes usar Come sin cuenta y sin compartir tu ubicación.</li>
            <li>Sólo pedimos datos cuando te registras, nominas un lugar o registras tu negocio.</li>
            <li>No vendemos tus datos personales ni los usamos para publicidad de terceros.</li>
            <li>La dirección que guardas se queda en tu dispositivo y puedes borrarla cuando quieras.</li>
            <li>Puedes acceder, rectificar, cancelar u oponerte al uso de tus datos escribiendo a {CONTACTO}.</li>
            <li>Para cerrar tu cuenta, sigue los pasos de <Link href="/eliminar-cuenta">eliminar tu cuenta</Link>.</li>
          </ul>
          <p>Este resumen no sustituye el aviso completo que aparece abajo.</p>
        </div>

        <nav className={styles.toc} aria-label="Índice del aviso de privacidad">
          <b>CONTENIDO</b>
          <ol>
            {INDICE.map(([id, titulo]) => (
              <li key={id}><a href={`#${id}`}>{titulo}</a></li>
            ))}
          </ol>
        </nav>

        <h2 id="responsable">1. Quién es responsable de tus datos</h2>
        <p>
          Mexica Gourmet, responsable de la plataforma Come (comeapp.com.mx y la aplicación móvil Come), es
          responsable del tratamiento de los datos personales que recabamos a través de ellas.
        </p>
        <p>
          Este aviso se emite conforme a la legislación mexicana en materia de protección de datos personales en
          posesión de particulares, y describe qué datos tratamos, con qué finalidades, con quién los compartimos y
          cómo puedes ejercer tus derechos.
        </p>
        <p>
          Puedes contactarnos para cualquier asunto de privacidad en <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.
        </p>

        <h2 id="datos">2. Qué datos recabamos</h2>
        <p>
          Recabamos únicamente los datos que necesitamos para operar la plataforma. Buena parte de Come funciona sin
          cuenta y sin darnos ningún dato: puedes explorar el directorio, las guías y el mapa como visitante.
        </p>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th scope="col">Dato</th>
                <th scope="col">Qué incluye</th>
                <th scope="col">Cuándo lo obtenemos</th>
              </tr>
            </thead>
            <tbody>
              {DATOS.map((fila) => (
                <tr key={fila.dato}>
                  <th scope="row">{fila.dato}</th>
                  <td>{fila.detalle}</td>
                  <td>{fila.cuando}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          No recabamos datos financieros ni patrimoniales: Come no procesa pagos ni cobra por sus servicios. Tampoco
          usamos herramientas de analítica o publicidad que te perfilen entre sitios.
        </p>

        <h2 id="finalidades">3. Para qué los usamos</h2>
        <h3>Finalidades necesarias</h3>
        <p>Sin estos tratamientos no podríamos darte el servicio:</p>
        <ul>
          <li>Crear tu cuenta, autenticarte y mantener tu sesión abierta.</li>
          <li>Mostrarte tu perfil y los negocios que has registrado.</li>
          <li>Revisar, editar y publicar las nominaciones y las fichas de negocio que nos envías.</li>
          <li>Contactarte a propósito de tu cuenta, de tu nominación o de la ficha de tu negocio.</li>
          <li>Ordenar los lugares por cercanía y calcular distancias, cuando compartes una ubicación.</li>
          <li>Mantener la seguridad de la plataforma, prevenir fraudes y abusos, y atender obligaciones legales.</li>
        </ul>
        <h3>Finalidades adicionales</h3>
        <p>
          No son necesarias para el servicio y puedes oponerte a ellas en cualquier momento escribiéndonos a
          {" "}{CONTACTO}, sin que eso afecte tu uso de Come:
        </p>
        <ul>
          <li>Enviarte novedades editoriales, guías y recomendaciones gastronómicas, si te suscribes.</li>
          <li>Elaborar estadísticas agregadas y anónimas para mejorar el contenido y las funciones de la plataforma.</li>
        </ul>

        <h2 id="sensibles">4. Datos sensibles y menores de edad</h2>
        <p>
          No solicitamos datos personales sensibles —origen étnico, estado de salud, creencias, preferencias sexuales,
          opiniones políticas ni datos biométricos—. Te pedimos que no los incluyas en los campos abiertos de los
          formularios.
        </p>
        <p>
          Come no está dirigido a menores de 18 años y no recabamos conscientemente sus datos. Si detectamos que una
          cuenta pertenece a un menor, la cancelaremos y eliminaremos la información asociada. Si eres madre, padre o
          tutor y crees que un menor nos compartió sus datos, escríbenos y los eliminaremos.
        </p>

        <h2 id="ubicacion">5. Ubicación</h2>
        <p>
          La ubicación siempre es opcional. Puedes escribir una dirección o autorizar al navegador o al teléfono a
          compartir tu posición aproximada. La usamos para ordenar los lugares por cercanía y mostrar distancias.
        </p>
        <ul>
          <li>La dirección que eliges se guarda en tu propio dispositivo —en el almacenamiento local del navegador o
            de la app—, no en nuestros servidores.</li>
          <li>Para convertir coordenadas en una dirección legible consultamos la API de Geocoding de Google Maps.</li>
          <li>No rastreamos tu ubicación en segundo plano ni guardamos un historial de tus desplazamientos.</li>
          <li>Puedes borrarla desde la propia plataforma, revocar el permiso en los ajustes de tu navegador o
            dispositivo, o limpiar los datos del sitio.</li>
        </ul>

        <h2 id="cookies">6. Cookies y almacenamiento local</h2>
        <p>
          Come no usa cookies publicitarias ni de seguimiento de terceros. Empleamos el almacenamiento del navegador y
          del dispositivo para lo estrictamente necesario:
        </p>
        <ul>
          <li><b>Sesión:</b> Firebase Authentication guarda un token para mantenerte con la sesión iniciada.</li>
          <li><b>Ubicación guardada:</b> la dirección que eliges, bajo la clave <code>come:ubicacion</code>.</li>
          <li><b>Preferencias de la interfaz:</b> ajustes menores de navegación.</li>
        </ul>
        <p>
          Puedes borrar estos datos desde tu navegador o desinstalando la app. Si lo haces, tendrás que iniciar sesión
          de nuevo y volver a indicar tu dirección.
        </p>

        <h2 id="terceros">7. Con quién los compartimos</h2>
        <p>
          No vendemos, alquilamos ni comercializamos tus datos personales. Los compartimos únicamente con proveedores
          que nos prestan servicios de infraestructura y que los tratan por nuestra cuenta y bajo nuestras
          instrucciones:
        </p>
        <ul>
          <li><b>Google (Firebase):</b> autenticación, base de datos, almacenamiento de archivos y alojamiento de la
            plataforma.</li>
          <li><b>Google Maps Platform:</b> mapas, búsqueda de direcciones y conversión de coordenadas.</li>
          <li><b>Apple y Google:</b> únicamente si eliges acceder con esas cuentas, para verificar tu identidad.</li>
          <li><b>Proveedor de nuestro sistema editorial:</b> alojamiento de las historias y del contenido publicado.</li>
        </ul>
        <p>
          Además podremos revelar datos cuando lo exija una autoridad competente o una obligación legal, y en caso de
          reestructura, fusión o adquisición de Come, informándolo previamente.
        </p>
        <p>
          La información que publicas voluntariamente —los datos de un negocio o de una nominación— es de carácter
          público una vez que la redacción la aprueba, y aparece en el directorio, el mapa y los buscadores.
        </p>

        <h2 id="transferencias">8. Transferencias fuera de México</h2>
        <p>
          Nuestros proveedores de infraestructura operan servidores en Estados Unidos y en otros países, por lo que tus
          datos pueden almacenarse o procesarse fuera de México. Estas transferencias son necesarias para prestarte el
          servicio y, conforme a la ley aplicable, no requieren tu consentimiento adicional. Exigimos a estos
          proveedores medidas de seguridad y compromisos de confidencialidad equivalentes a los de este aviso.
        </p>

        <h2 id="conservacion">9. Cuánto tiempo los conservamos</h2>
        <ul>
          <li><b>Datos de tu cuenta:</b> mientras la cuenta siga activa y hasta dos años después de cerrarla, para
            atender obligaciones legales y reclamaciones.</li>
          <li><b>Fichas de negocio publicadas:</b> mientras el establecimiento aparezca en el directorio.</li>
          <li><b>Nominaciones no publicadas:</b> hasta veinticuatro meses después de su revisión.</li>
          <li><b>Registros técnicos y de seguridad:</b> los plazos que fijan nuestros proveedores de infraestructura,
            normalmente no mayores a doce meses.</li>
        </ul>
        <p>Concluidos esos plazos, los datos se eliminan o se anonimizan de forma irreversible.</p>

        <h2 id="seguridad">10. Seguridad</h2>
        <p>
          Aplicamos medidas administrativas, técnicas y físicas para proteger tus datos: cifrado en tránsito (HTTPS),
          contraseñas cifradas gestionadas por Firebase Authentication, reglas de acceso que limitan quién puede leer y
          escribir cada dato, y accesos restringidos al personal de la redacción que los necesita.
        </p>
        <p>
          Ningún sistema es infalible. Si ocurriera una vulneración que afecte de forma significativa tus derechos, te
          lo notificaremos sin demora, junto con las medidas adoptadas y las recomendaciones aplicables.
        </p>

        <h2 id="arco">11. Tus derechos ARCO</h2>
        <p>Tienes derecho a:</p>
        <ul>
          <li><b>Acceder</b> a los datos personales que tenemos sobre ti y saber cómo los usamos.</li>
          <li><b>Rectificarlos</b> cuando sean inexactos o estén incompletos.</li>
          <li><b>Cancelarlos</b> cuando consideres que no los necesitamos para las finalidades de este aviso.</li>
          <li><b>Oponerte</b> a un tratamiento concreto o a las finalidades adicionales.</li>
        </ul>
        <p>
          Para ejercerlos, escribe a <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a> con el asunto &laquo;Derechos
          ARCO&raquo; e incluye:
        </p>
        <ol>
          <li>Tu nombre y un correo o medio para responderte.</li>
          <li>Una copia de una identificación oficial, o del documento que acredite tu representación.</li>
          <li>La descripción clara de los datos y del derecho que quieres ejercer.</li>
          <li>Si pides una rectificación, la corrección y la documentación que la sustente.</li>
        </ol>
        <p>
          Responderemos en un plazo máximo de veinte días hábiles y, si la solicitud procede, la haremos efectiva
          dentro de los quince días hábiles siguientes. El ejercicio de estos derechos es gratuito; sólo podrán
          cobrarse los gastos de envío o reproducción justificados.
        </p>

        <h2 id="revocacion">12. Revocar tu consentimiento</h2>
        <p>
          Puedes revocar en cualquier momento el consentimiento que nos otorgaste, con el mismo procedimiento del
          apartado anterior. Ten en cuenta que en algunos casos no podremos atender la solicitud de inmediato por
          obligaciones legales, y que revocarlo puede implicar que dejemos de prestarte ciertos servicios, como
          mantener tu cuenta o la ficha de tu negocio.
        </p>
        <p>
          Los permisos de ubicación y de notificaciones puedes revocarlos directamente en los ajustes de tu navegador o
          de tu dispositivo, sin necesidad de escribirnos.
        </p>

        <h2 id="eliminar-cuenta">13. Eliminar tu cuenta</h2>
        <p>
          Puedes pedir en cualquier momento que eliminemos tu cuenta y los datos personales asociados. En la página
          {" "}<Link href="/eliminar-cuenta">eliminar tu cuenta</Link> encontrarás el procedimiento, qué información se
          borra, qué conservamos y durante cuánto tiempo, y los plazos de respuesta.
        </p>

        <h2 id="limitacion">14. Limitar el uso y la divulgación</h2>
        <p>
          Si sólo quieres dejar de recibir comunicaciones editoriales o promocionales, basta con usar el enlace para
          darte de baja incluido en cada correo, o escribirnos a {CONTACTO} con el asunto &laquo;Baja de
          comunicaciones&raquo;. Esta solicitud no afecta tu cuenta ni el resto del servicio.
        </p>

        <h2 id="cambios">15. Cambios a este aviso</h2>
        <p>
          Podemos actualizar este aviso cuando cambien las funciones de la plataforma, nuestros proveedores o la
          normativa aplicable. La versión vigente es siempre la publicada en esta página, con su fecha de última
          actualización. Si el cambio es sustancial, lo anunciaremos en el sitio o por correo antes de que surta
          efecto.
        </p>

        <h2 id="autoridad">16. Autoridad en materia de datos personales</h2>
        <p>
          Si consideras que tu derecho a la protección de datos personales ha sido vulnerado, puedes acudir a la
          autoridad competente en México en materia de protección de datos personales en posesión de particulares y
          presentar la denuncia o el procedimiento que corresponda. Te agradeceremos que antes nos lo hagas saber para
          intentar resolverlo directamente.
        </p>

        <h2 id="contacto">17. Contacto</h2>
        <p>Para cualquier asunto relacionado con tus datos personales:</p>
        <div className={styles.contactBox}>
          <p><b>Come · Mexica Gourmet</b></p>
          <p>Correo: <a href={`mailto:${CONTACTO}`}>{CONTACTO}</a></p>
          <p>Sitio: comeapp.com.mx</p>
        </div>

        <div className={styles.actions}>
          <Link href="/">Volver al inicio</Link>
          <Link href="/terminos">Términos y condiciones</Link>
        </div>
      </article>
    </main>
  );
}
