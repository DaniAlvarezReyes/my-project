'use client';
import React, { useState } from 'react';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');

  const faqs: FAQItem[] = [
    // Pedidos y Envíos
    {
      category: 'pedidos',
      question: '¿Cuánto tarda en llegar mi pedido?',
      answer: 'Los pedidos a España peninsular tardan entre 3-5 días laborables. Para Baleares 5-7 días, y para Canarias, Ceuta y Melilla entre 7-10 días laborables. Recibirás un email con el número de seguimiento cuando se envíe tu pedido.',
    },
    {
      category: 'pedidos',
      question: '¿Cuánto cuesta el envío?',
      answer: 'El envío a España peninsular cuesta 5,99€. ¡GRATIS para pedidos superiores a 50€! Para Baleares el coste es de 9,99€ y para Canarias, Ceuta y Melilla 14,99€.',
    },
    {
      category: 'pedidos',
      question: '¿Puedo hacer seguimiento de mi pedido?',
      answer: 'Sí, una vez enviado tu pedido recibirás un email con el número de seguimiento. También puedes ver el estado de tus pedidos en la sección "Mis Pedidos" de tu cuenta.',
    },
    {
      category: 'pedidos',
      question: '¿Puedo cambiar o cancelar mi pedido?',
      answer: 'Puedes cancelar tu pedido dentro de las primeras 2 horas después de realizarlo contactando con nosotros. Una vez procesado y enviado, ya no es posible cancelarlo, pero puedes devolverlo siguiendo nuestra política de devoluciones.',
    },
    // Pagos
    {
      category: 'pagos',
      question: '¿Qué métodos de pago aceptáis?',
      answer: 'Aceptamos pagos con tarjeta de crédito y débito (Visa, Mastercard, American Express) a través de Stripe, nuestro procesador de pagos seguro. Todos los pagos están protegidos con cifrado SSL.',
    },
    {
      category: 'pagos',
      question: '¿Es seguro comprar en vuestra web?',
      answer: 'Absolutamente. Utilizamos Stripe, uno de los procesadores de pago más seguros del mundo, con certificación PCI-DSS nivel 1. Todos los datos de pago están cifrados y nunca almacenamos información de tarjetas en nuestros servidores.',
    },
    {
      category: 'pagos',
      question: '¿Cuándo se cargará el pago en mi tarjeta?',
      answer: 'El cargo se realiza inmediatamente después de completar tu compra. Verás el cargo como "Sneakers Pro" en tu extracto bancario.',
    },
    // Devoluciones
    {
      category: 'devoluciones',
      question: '¿Puedo devolver un producto?',
      answer: 'Sí, tienes 30 días desde la recepción del pedido para devolver cualquier producto que no te haya gustado o no sea de tu talla. El producto debe estar sin usar, con su embalaje original y todas las etiquetas.',
    },
    {
      category: 'devoluciones',
      question: '¿Cómo hago una devolución?',
      answer: 'Contáctanos por email a devoluciones@sneakerspro.com o por teléfono al 900 123 456. Te proporcionaremos un número de autorización (RMA) y las instrucciones de envío. Los gastos de devolución corren por tu cuenta excepto si el producto es defectuoso.',
    },
    {
      category: 'devoluciones',
      question: '¿Cuándo recibiré mi reembolso?',
      answer: 'Una vez recibido y verificado tu producto, procesaremos el reembolso en 7-14 días laborables. El dinero se devolverá al mismo método de pago que utilizaste para la compra.',
    },
    {
      category: 'devoluciones',
      question: '¿Puedo cambiar un producto por otra talla?',
      answer: 'Sí, puedes realizar un cambio de talla. Contáctanos y te indicaremos el proceso. Para agilizar, puedes devolver el producto actual y hacer un nuevo pedido con la talla correcta.',
    },
    // Productos
    {
      category: 'productos',
      question: '¿Son originales todos vuestros productos?',
      answer: '100% originales. Trabajamos directamente con distribuidores oficiales de todas las marcas que vendemos. Todos nuestros productos vienen con garantía del fabricante.',
    },
    {
      category: 'productos',
      question: '¿Cómo sé qué talla elegir?',
      answer: 'En cada producto encontrarás una guía de tallas. Te recomendamos medir tu pie y compararlo con la tabla. Si tienes dudas entre dos tallas, generalmente es mejor elegir la talla mayor.',
    },
    {
      category: 'productos',
      question: '¿Tenéis stock de todos los productos?',
      answer: 'Actualizamos nuestro stock en tiempo real. Si un producto está disponible para añadir al carrito, significa que tenemos stock. Los productos agotados se marcan claramente.',
    },
    {
      category: 'productos',
      question: '¿Cuándo volveréis a tener stock de X producto?',
      answer: 'Puedes suscribirte a las notificaciones de disponibilidad en la página del producto. Te enviaremos un email cuando vuelva a estar disponible.',
    },
    // Cuenta
    {
      category: 'cuenta',
      question: '¿Necesito crear una cuenta para comprar?',
      answer: 'Sí, necesitas crear una cuenta para realizar compras. Esto nos permite procesar tu pedido, enviarte confirmaciones y que puedas hacer seguimiento de tus compras.',
    },
    {
      category: 'cuenta',
      question: '¿Cómo cambio mi contraseña?',
      answer: 'Ve a "Mi Cuenta" y selecciona "Cambiar contraseña". También puedes usar la opción "¿Olvidaste tu contraseña?" en la página de inicio de sesión.',
    },
    {
      category: 'cuenta',
      question: '¿Puedo guardar varias direcciones de envío?',
      answer: 'Sí, en la sección "Direcciones" de tu cuenta puedes añadir y gestionar múltiples direcciones. Puedes seleccionar cuál usar en cada pedido.',
    },
    // Otros
    {
      category: 'otros',
      question: '¿Tenéis tienda física?',
      answer: 'Actualmente somos una tienda exclusivamente online, lo que nos permite ofrecerte mejores precios al eliminar los costes de una tienda física.',
    },
    {
      category: 'otros',
      question: '¿Hacéis envíos internacionales?',
      answer: 'Por el momento solo realizamos envíos a España (península, Baleares, Canarias, Ceuta y Melilla). Estamos trabajando en expandirnos a otros países europeos próximamente.',
    },
    {
      category: 'otros',
      question: '¿Cómo puedo contactar con vosotros?',
      answer: 'Puedes contactarnos por email en contacto@sneakerspro.com, por teléfono al 900 123 456 (L-V 9:00-18:00) o a través de nuestro formulario de contacto.',
    },
  ];

  const categories = [
    { id: 'todas', name: 'Todas las preguntas' },
    { id: 'pedidos', name: 'Pedidos y Envíos' },
    { id: 'pagos', name: 'Pagos y Seguridad' },
    { id: 'devoluciones', name: 'Devoluciones y Cambios' },
    { id: 'productos', name: 'Productos' },
    { id: 'cuenta', name: 'Mi Cuenta' },
    { id: 'otros', name: 'Otros' },
  ];

  const filteredFaqs = selectedCategory === 'todas' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Preguntas Frecuentes
          </h1>
          <p className="text-lg text-gray-600">
            Encuentra respuestas rápidas a las preguntas más comunes
          </p>
        </div>

        {/* Categorías */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center bg-blue-50 rounded-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¿No encuentras lo que buscas?
            </h3>
            <p className="text-gray-600 mb-6">
              Nuestro equipo de soporte está aquí para ayudarte
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contacto"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Contáctanos
              </a>
              <a
                href="tel:+34900123456"
                className="inline-block bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Llamar: 900 123 456
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer
        siteName="Sneakers Pro"
        description="Tu tienda de confianza"
        sections={[]}
        socialLinks={[]}
      />
    </div>
  );
}
