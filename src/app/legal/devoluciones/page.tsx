import { LegalPageLayout } from '@/components/LegalPageLayout';

export default function DevolucionesPage() {
  return (
    <LegalPageLayout title="Política de Devoluciones" lastUpdated="13 de febrero de 2026">
      <h2>Derecho de Devolución</h2>
      <p>
        En Sneakers Pro, queremos que estés completamente satisfecho con tu compra. Si por alguna razón 
        no estás satisfecho con tu pedido, tienes <strong>30 días</strong> desde la fecha de recepción 
        para solicitar una devolución.
      </p>

      <h2>Condiciones de Devolución</h2>
      <p>Para que una devolución sea válida, los productos deben cumplir las siguientes condiciones:</p>
      <ul>
        <li>El producto debe estar <strong>sin usar</strong> y en perfectas condiciones</li>
        <li>Debe conservar su <strong>embalaje original</strong> y todas las etiquetas</li>
        <li>No deben haber transcurrido más de <strong>30 días</strong> desde la recepción</li>
        <li>Debe incluirse el <strong>ticket o factura</strong> de compra</li>
      </ul>

      <h2>Productos No Elegibles</h2>
      <p>Por razones de higiene y seguridad, NO se aceptan devoluciones de:</p>
      <ul>
        <li>Productos usados o con signos evidentes de uso</li>
        <li>Productos sin embalaje original o etiquetas</li>
        <li>Productos dañados por mal uso del cliente</li>
        <li>Productos personalizados o bajo pedido especial</li>
        <li>Artículos en oferta final o liquidación (salvo defecto)</li>
      </ul>

      <h2>Proceso de Devolución</h2>
      <p>Sigue estos pasos para devolver un producto:</p>

      <h3>Paso 1: Solicitar Devolución</h3>
      <p>Contacta con nuestro servicio de atención al cliente:</p>
      <ul>
        <li>Email: devoluciones@sneakerspro.com</li>
        <li>Teléfono: +34 900 123 456 (L-V: 9:00-18:00)</li>
        <li>Formulario web: <a href="/contacto" className="text-blue-600 hover:text-blue-700">Contacto</a></li>
      </ul>
      <p>Facilita:</p>
      <ul>
        <li>Número de pedido</li>
        <li>Producto(s) a devolver</li>
        <li>Motivo de la devolución</li>
      </ul>

      <h3>Paso 2: Autorización</h3>
      <p>
        Recibirás un <strong>número de autorización de devolución (RMA)</strong> por email en un plazo máximo de 24 horas. 
        Este número debe incluirse en el paquete de devolución.
      </p>

      <h3>Paso 3: Envío</h3>
      <p>Envía el paquete a:</p>
      <div className="bg-gray-100 p-4 rounded-lg my-4">
        <p className="font-semibold">Centro de Devoluciones Sneakers Pro</p>
        <p>Calle Devoluciones 123</p>
        <p>28050 Madrid, España</p>
        <p className="mt-2 text-sm text-gray-600">
          Referencia: [Tu Número RMA]
        </p>
      </div>

      <h3>Paso 4: Inspección</h3>
      <p>
        Una vez recibido el producto, lo inspeccionaremos para verificar que cumple las condiciones de devolución. 
        Este proceso puede tardar entre <strong>3-5 días laborables</strong>.
      </p>

      <h3>Paso 5: Reembolso</h3>
      <p>
        Si la devolución es aprobada, procesaremos tu reembolso en un plazo de <strong>7-14 días laborables</strong>. 
        El reembolso se realizará al mismo método de pago utilizado en la compra original.
      </p>

      <h2>Costes de Envío</h2>
      <p>Los gastos de envío de la devolución varían según el motivo:</p>

      <h3>A Cargo del Cliente</h3>
      <ul>
        <li>Cambio de opinión</li>
        <li>Pedido equivocado por parte del cliente</li>
        <li>Talla o color no adecuado</li>
      </ul>

      <h3>A Cargo de Sneakers Pro</h3>
      <ul>
        <li>Producto defectuoso o dañado</li>
        <li>Error en el envío (producto incorrecto)</li>
        <li>Producto no coincide con la descripción</li>
      </ul>

      <h2>Cambios y Tallas</h2>
      <p>
        Si deseas cambiar un producto por otra talla o color, debes realizar una devolución del producto 
        original y hacer un nuevo pedido del producto deseado. Esto nos permite procesar tu solicitud más rápidamente.
      </p>

      <h2>Reembolsos</h2>
      <p>Los reembolsos se procesan de la siguiente manera:</p>
      <ul>
        <li><strong>Tarjeta de crédito/débito</strong>: 7-14 días laborables</li>
        <li><strong>PayPal</strong>: 5-7 días laborables</li>
        <li><strong>Transferencia bancaria</strong>: 3-5 días laborables</li>
      </ul>
      <p>
        <strong>Nota</strong>: Los gastos de envío originales no son reembolsables, excepto en caso de 
        producto defectuoso o error por nuestra parte.
      </p>

      <h2>Productos Defectuosos</h2>
      <p>Si recibes un producto defectuoso o dañado:</p>
      <ol>
        <li>Contacta inmediatamente con nosotros (máximo 48 horas desde la recepción)</li>
        <li>Envía fotos del defecto o daño</li>
        <li>Te enviaremos un reemplazo sin coste adicional</li>
        <li>O procesaremos un reembolso completo si lo prefieres</li>
      </ol>

      <h2>Garantía</h2>
      <p>
        Todos nuestros productos están cubiertos por la <strong>garantía del fabricante</strong> durante 
        el período especificado para cada producto (normalmente 2 años para calzado deportivo). 
        Esta garantía cubre defectos de fabricación, pero no el desgaste normal por uso.
      </p>

      <h2>Preguntas Frecuentes</h2>

      <h3>¿Cuánto tarda el reembolso?</h3>
      <p>
        Una vez aprobada la devolución, el reembolso se procesa en 7-14 días laborables. 
        El tiempo exacto puede variar según tu banco.
      </p>

      <h3>¿Puedo devolver un producto comprado en oferta?</h3>
      <p>
        Sí, puedes devolver productos en oferta siempre que cumplan las condiciones generales de devolución. 
        Los productos marcados como "oferta final" no son elegibles para devolución, excepto por defecto.
      </p>

      <h3>¿Qué hago si perdí el ticket de compra?</h3>
      <p>
        No te preocupes. Si tienes un número de pedido, podemos verificar tu compra en nuestro sistema. 
        Contacta con atención al cliente con tu número de pedido.
      </p>

      <h3>¿Ofrecen recogida a domicilio?</h3>
      <p>
        Actualmente no ofrecemos servicio de recogida a domicilio. Debes enviar el paquete por tu cuenta 
        al centro de devoluciones. Te recomendamos usar un método de envío con seguimiento.
      </p>

      <h2>Contacto</h2>
      <p>
        Para cualquier consulta sobre devoluciones, nuestro equipo está disponible para ayudarte:
      </p>
      <ul>
        <li>Email: devoluciones@sneakerspro.com</li>
        <li>Teléfono: +34 900 123 456</li>
        <li>Horario: Lunes a Viernes, 9:00-18:00</li>
        <li>Chat en vivo: Disponible en nuestro sitio web</li>
      </ul>

      <h2>Derechos del Consumidor</h2>
      <p>
        Esta política de devoluciones no afecta a tus derechos legales como consumidor según la legislación 
        española y europea. Tienes derecho a un período de reflexión de 14 días para compras online según 
        la Ley de Consumidores.
      </p>
    </LegalPageLayout>
  );
}
