import React from 'react';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuestra Historia — Sneakers Pro',
  description: 'Conoce a Sneakers Pro: la tienda de zapatillas de referencia en España. Pasión por el sneaker, calidad garantizada.',
};

const stats = [
  { value: '+5.000', label: 'Clientes satisfechos' },
  { value: '200+', label: 'Modelos disponibles' },
  { value: '98%', label: 'Valoraciones positivas' },
  { value: '24h', label: 'Soporte al cliente' },
];

const values = [
  { icon: '👟', title: 'Pasión por el sneaker', desc: 'Somos sneakerheads antes que vendedores. Cada modelo que añadimos lo probamos y seleccionamos con cuidado.' },
  { icon: '✅', title: 'Calidad garantizada', desc: 'Solo trabajamos con distribuidores oficiales. Cero imitaciones, cero compromisos.' },
  { icon: '🚀', title: 'Envío ultra-rápido', desc: 'Preparamos tu pedido en 24 horas. Envío express disponible para que no esperes.' },
  { icon: '💚', title: 'Sostenibilidad', desc: 'Materiales reciclados en nuestros embalajes y colaboramos con marcas con compromiso ambiental.' },
];

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <MainNav />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden bg-black flex items-end">
        <img
          src="https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1920&q=80"
          alt="Sneakers Pro"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/60 mb-3">Nuestra historia</p>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none">Somos<br />Sneakers Pro</h1>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-black text-gray-900 dark:text-white mb-1">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Cómo empezó todo</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Nacimos de una obsesión compartida</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>En 2020, un grupo de amigos cansados de encontrar zapatillas de calidad a precios abusivos decidió construir la tienda que ellos mismos querrían usar.</p>
              <p>Empezamos con 15 referencias. Hoy tenemos más de 200 modelos de las mejores marcas del mundo: Nike, Adidas, New Balance, Puma y mucho más.</p>
              <p>Lo que no ha cambiado es nuestra filosofía: producto auténtico, precio justo, y un servicio que te haga sentir que compraste en la mejor tienda de la ciudad… pero desde el sofá de tu casa.</p>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"
              alt="Nuestra colección"
              className="w-full h-96 object-cover rounded-2xl"
            />
            <div className="absolute -bottom-4 -left-4 bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-xl shadow-xl">
              <p className="text-2xl font-black">Desde 2020</p>
              <p className="text-sm opacity-70">Calidad sin compromiso</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 dark:bg-neutral-950 border-y border-gray-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-3">Lo que nos mueve</p>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Nuestros valores</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">¿Listo para encontrar tu par perfecto?</h2>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto">Explora nuestra colección y descubre por qué miles de clientes confían en Sneakers Pro.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/productos" className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity">
            Ver colección completa
          </Link>
          <Link href="/contacto" className="px-8 py-4 border-2 border-gray-200 dark:border-neutral-700 font-bold rounded-xl hover:border-black dark:hover:border-white transition-colors">
            Contactar con nosotros
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
