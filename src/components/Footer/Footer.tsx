import React from 'react';
import Link from 'next/link';

export interface FooterLink { label: string; href: string; }
export interface FooterSection { title: string; links: FooterLink[]; }
export interface SocialLink { platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube'; url: string; }
export interface FooterProps { siteName?: string; description?: string; sections?: FooterSection[]; socialLinks?: SocialLink[]; copyrightText?: string; theme?: { backgroundColor?: string; textColor?: string; }; }

const defaultSections: FooterSection[] = [
  { title: 'Tienda', links: [
    { label: 'Novedades', href: '/productos?filter=nuevos' },
    { label: 'Todos los productos', href: '/productos' },
    { label: 'Ofertas', href: '/productos?filter=ofertas' },
    { label: 'Categorías', href: '/categorias' },
    { label: 'Nuestra historia', href: '/nosotros' },
  ]},
  { title: 'Soporte', links: [
    { label: 'Contacto', href: '/contacto' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Envíos', href: '/legal/envios' },
    { label: 'Devoluciones', href: '/legal/devoluciones' },
  ]},
  { title: 'Legal', links: [
    { label: 'Términos y Condiciones', href: '/legal/terminos' },
    { label: 'Política de Privacidad', href: '/legal/privacidad' },
    { label: 'Política de Cookies', href: '/legal/cookies' },
  ]},
  { title: 'Cuenta', links: [
    { label: 'Mi Perfil', href: '/cuenta' },
    { label: 'Mis Pedidos', href: '/cuenta/pedidos' },
    { label: 'Favoritos', href: '/cuenta/favoritos' },
    { label: 'Devoluciones', href: '/cuenta/devoluciones' },
  ]},
];

export const Footer: React.FC<FooterProps> = ({ sections }) => {
  const cols = sections && sections.length > 0 ? sections : defaultSections;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 text-neutral-400">
      {/* Top border accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-16 pb-8">
        {/* Logo + columns */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-xl font-black text-white uppercase tracking-tight">Sneakers Pro</span>
            </Link>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">
              Tu tienda de zapatillas online. Envío gratis en pedidos superiores a 50€. Devoluciones gratuitas 30 días.
            </p>
            <div className="flex gap-4 mt-6">
              {['instagram', 'twitter'].map(platform => (
                <a key={platform} href="#" className="text-neutral-600 hover:text-white transition-colors">
                  {platform === 'instagram' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-neutral-500 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-neutral-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-600">© {year} Sneakers Pro. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-600">Pago seguro</span>
            <div className="flex gap-2 text-neutral-600">
              {['Visa', 'MC', 'PP'].map(c => (
                <span key={c} className="text-[10px] font-bold border border-neutral-700 px-2 py-0.5">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
