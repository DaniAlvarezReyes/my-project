import { LegalPageLayout } from '@/components/LegalPageLayout';

export default function PrivacidadPage() {
  return (
    <LegalPageLayout title="Política de Privacidad" lastUpdated="13 de febrero de 2026">
      <h2>1. Información que Recopilamos</h2>
      <p>
        En Sneakers Pro, recopilamos la siguiente información cuando utilizas nuestro sitio web:
      </p>
      <ul>
        <li>Información personal (nombre, apellidos, email, teléfono)</li>
        <li>Dirección de envío y facturación</li>
        <li>Información de pago (procesada de forma segura por Stripe)</li>
        <li>Historial de compras y preferencias</li>
        <li>Datos de navegación y cookies</li>
      </ul>

      <h2>2. Cómo Usamos tu Información</h2>
      <p>Utilizamos tu información personal para:</p>
      <ul>
        <li>Procesar y enviar tus pedidos</li>
        <li>Gestionar tu cuenta de usuario</li>
        <li>Enviarte confirmaciones de compra y actualizaciones de envío</li>
        <li>Mejorar nuestros productos y servicios</li>
        <li>Enviarte ofertas promocionales (con tu consentimiento)</li>
        <li>Cumplir con obligaciones legales</li>
      </ul>

      <h2>3. Protección de tus Datos</h2>
      <p>
        Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos personales contra el acceso no autorizado, la pérdida o la alteración.
      </p>
      <ul>
        <li>Cifrado SSL/TLS en todas las transacciones</li>
        <li>Procesamiento de pagos a través de Stripe (certificado PCI-DSS)</li>
        <li>Acceso restringido a datos personales solo para personal autorizado</li>
        <li>Copias de seguridad regulares</li>
      </ul>

      <h2>4. Compartir Información</h2>
      <p>No vendemos ni alquilamos tu información personal. Solo compartimos datos con:</p>
      <ul>
        <li><strong>Procesadores de pago</strong>: Stripe para procesar transacciones</li>
        <li><strong>Servicios de envío</strong>: Para entregar tus pedidos</li>
        <li><strong>Proveedores de servicios</strong>: Que nos ayudan a operar nuestro negocio</li>
        <li><strong>Autoridades legales</strong>: Cuando sea requerido por ley</li>
      </ul>

      <h2>5. Cookies</h2>
      <p>
        Utilizamos cookies para mejorar tu experiencia de navegación. Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades del sitio.
      </p>

      <h2>6. Tus Derechos</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li>Acceder a tus datos personales</li>
        <li>Rectificar información incorrecta</li>
        <li>Solicitar la eliminación de tus datos</li>
        <li>Oponerte al procesamiento de tus datos</li>
        <li>Solicitar la portabilidad de tus datos</li>
        <li>Retirar tu consentimiento en cualquier momento</li>
      </ul>

      <h2>7. Retención de Datos</h2>
      <p>
        Conservamos tus datos personales durante el tiempo necesario para cumplir con los fines descritos en esta política y según lo requiera la ley (mínimo 6 años para datos fiscales).
      </p>

      <h2>8. Contacto</h2>
      <p>
        Si tienes preguntas sobre nuestra política de privacidad o quieres ejercer tus derechos, contáctanos en:
      </p>
      <ul>
        <li>Email: privacidad@sneakerspro.com</li>
        <li>Teléfono: +34 900 123 456</li>
        <li>Dirección: Calle Ejemplo 123, 28001 Madrid, España</li>
      </ul>

      <h2>9. Cambios en esta Política</h2>
      <p>
        Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos cualquier cambio significativo por email o mediante un aviso destacado en nuestro sitio web.
      </p>
    </LegalPageLayout>
  );
}
