'use client';
import React, { useState } from 'react';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulario enviado:', formData);
    setSubmitted(true);
    // Aquí conectarías con tu backend o servicio de email
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contacta con Nosotros</h1>
          <p className="text-lg text-gray-600">
            ¿Tienes alguna pregunta? Estamos aquí para ayudarte
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información de contacto */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4 mb-6">
                <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-gray-600">contacto@sneakerspro.com</p>
                  <p className="text-gray-600">soporte@sneakerspro.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Teléfono</h3>
                  <p className="text-gray-600">+34 900 123 456</p>
                  <p className="text-sm text-gray-500">L-V: 9:00 - 18:00</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Oficina</h3>
                  <p className="text-gray-600">
                    Calle Ejemplo 123<br />
                    28001 Madrid, España
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">FAQ</h3>
              <p className="text-sm text-blue-800 mb-3">
                Muchas preguntas comunes ya están respondidas en nuestra sección de preguntas frecuentes.
              </p>
              <a href="/faq" className="text-blue-600 font-medium text-sm hover:text-blue-700">
                Ver FAQ →
              </a>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">¡Mensaje Enviado!</h2>
                  <p className="text-gray-600 mb-6">
                    Gracias por contactarnos. Te responderemos lo antes posible.
                  </p>
                  <Button variant="primary" onClick={() => setSubmitted(false)}>
                    Enviar Otro Mensaje
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h2 className="text-2xl font-bold mb-6">Envíanos un Mensaje</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <TextField
                      label="Nombre *"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Email *"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <TextField
                      label="Teléfono"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      fullWidth
                    />
                    <TextField
                      label="Asunto *"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      fullWidth
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Escribe tu mensaje aquí..."
                    />
                  </div>

                  <Button type="submit" variant="primary" size="lg" fullWidth>
                    Enviar Mensaje
                  </Button>
                </form>
              )}
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
