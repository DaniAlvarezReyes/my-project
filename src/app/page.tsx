'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { ProductCard } from '@/components/ProductCard';
import { Footer } from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { Reveal } from '@/components/useScrollReveal';
import { categories } from '@/data/categories';
import RecentlyViewed from '@/components/RecentlyViewed';
import SplitText from '@/components/SplitText';
import InstagramFeed from '@/components/InstagramFeed';

const heroSlides = [
  { image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1920&q=80', subtitle: 'Nueva Colección 2025', title: 'Define tu propio estilo', cta: 'Explorar tienda', href: '/productos' },
  { image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1920&q=80', subtitle: 'Ofertas Exclusivas', title: 'Hasta -40% en selección', cta: 'Ver ofertas', href: '/productos?filter=ofertas' },
  { image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1920&q=80', subtitle: 'Running 2025', title: 'Corre sin límites', cta: 'Ver running', href: '/productos?categoria=running' },
];

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*, color_variants:product_color_variants(color_name, color_hex, images)')
          .order('created_at', { ascending: false });
        if (data) setProducts(data);
      } catch {}
    };
    load();
  }, []);

  // Auto-advance hero slides
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % heroSlides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const featured = products.slice(0, 8);
  const onSale = products.filter(p => p.original_price && p.original_price > p.price).slice(0, 4);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus('loading');
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({ email: newsletterEmail.trim().toLowerCase() });
      if (error && error.code !== '23505') throw error;
      setNewsletterStatus('success');
      setNewsletterEmail('');
    } catch { setNewsletterStatus('error'); }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <MainNav />

      {/* ─── HERO CAROUSEL ─── */}
      <section className="relative h-[90vh] min-h-[600px] overflow-hidden bg-black">
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === currentSlide ? 1 : 0 }}
          >
            <img src={slide.image} alt="" className="w-full h-full object-cover scale-105" style={{ animation: i === currentSlide ? 'zoomSlow 8s ease-in-out forwards' : 'none' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        ))}

        <div className="relative h-full flex flex-col justify-end max-w-[1440px] mx-auto px-6 lg:px-10 pb-16 lg:pb-24">
          <div key={currentSlide}>
            <p className="text-white/50 text-xs font-bold uppercase tracking-[0.3em] mb-4 animate-fadeInUp">{heroSlides[currentSlide].subtitle}</p>
            <SplitText as="h1" className="text-white text-5xl sm:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tight max-w-4xl">
              {heroSlides[currentSlide].title}
            </SplitText>
            <div className="mt-8 animate-fadeInUp" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
              <Link href={heroSlides[currentSlide].href} className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors">
                {heroSlides[currentSlide].cta}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>

          {/* Slide indicators */}
          <div className="absolute bottom-8 right-6 lg:right-10 flex gap-2">
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`h-0.5 transition-all duration-500 ${i === currentSlide ? 'w-8 bg-white' : 'w-4 bg-white/30 hover:bg-white/50'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <div className="border-y border-neutral-200 dark:border-neutral-800 py-4 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <React.Fragment key={i}>
              {['ENVÍO GRATIS +50€', 'DEVOLUCIONES 30 DÍAS', 'PAGO SEGURO', 'GARANTÍA DE CALIDAD', 'NUEVAS LLEGADAS CADA SEMANA'].map(text => (
                <span key={`${i}-${text}`} className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-600 flex items-center gap-8">
                  {text} <span className="text-neutral-300 dark:text-neutral-700">✦</span>
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ─── FEATURED PRODUCTS ─── */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <Reveal>
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-2">Selección</p>
              <SplitText as="h2" className="text-3xl lg:text-5xl font-black uppercase tracking-tight text-neutral-900 dark:text-white">Destacados</SplitText>
            </div>
            <Link href="/productos" className="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black dark:hover:text-white hover-line transition-colors hidden sm:block">Ver todo →</Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6 lg:gap-y-14 stagger-children">
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ─── VIDEO SECTION ─── */}
      <Reveal>
        <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1920&q=80"
          >
            <source src="https://cdn.coverr.co/videos/coverr-running-shoes-on-a-treadmill/1080p.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative h-full flex items-center justify-center text-center px-6">
            <div>
              <SplitText as="h2" className="text-white text-4xl lg:text-6xl font-black uppercase tracking-tight mb-6">
                Mueve el mundo
              </SplitText>
              <p className="text-white/60 text-sm max-w-md mx-auto mb-8">Zapatillas diseñadas para cada paso, cada meta, cada momento.</p>
              <Link href="/productos?categoria=running" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors">
                Ver Running
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ─── LOOKBOOK / EDITORIAL ─── */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <Reveal>
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-2">Lookbook</p>
            <SplitText as="h2" className="text-3xl lg:text-5xl font-black uppercase tracking-tight text-neutral-900 dark:text-white">Estilo urbano</SplitText>
          </div>
        </Reveal>

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          <Reveal delay={0} className="col-span-12 lg:col-span-7">
            <Link href="/productos?categoria=lifestyle" className="block relative aspect-[4/3] overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&q=80" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-white text-2xl lg:text-3xl font-black uppercase tracking-tight">Lifestyle</p>
                <p className="text-white/60 text-sm mt-1">Explora la colección →</p>
              </div>
            </Link>
          </Reveal>

          <div className="col-span-12 lg:col-span-5 grid grid-rows-2 gap-4 lg:gap-6">
            <Reveal delay={0.1}>
              <Link href="/productos?categoria=basketball" className="block relative aspect-[16/9] lg:aspect-auto lg:h-full overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&q=80" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <p className="text-white text-xl font-black uppercase tracking-tight">Basketball</p>
                </div>
              </Link>
            </Reveal>
            <Reveal delay={0.2}>
              <Link href="/productos?categoria=skateboarding" className="block relative aspect-[16/9] lg:aspect-auto lg:h-full overflow-hidden group">
                <img src="https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&q=80" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <p className="text-white text-xl font-black uppercase tracking-tight">Skateboarding</p>
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="bg-neutral-50 dark:bg-neutral-950 py-20 lg:py-28">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-2">Explora</p>
              <SplitText as="h2" className="text-3xl lg:text-5xl font-black uppercase tracking-tight text-neutral-900 dark:text-white">Categorías</SplitText>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.slice(0, 6).map((cat, i) => (
              <Reveal key={cat.id} delay={i * 0.06}>
                <Link href={`/productos?categoria=${cat.slug}`} className="group relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-900 block">
                  <img src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white text-lg lg:text-xl font-black uppercase tracking-tight">{cat.name}</h3>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ON SALE ─── */}
      {onSale.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <Reveal>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-500 mb-2">Oferta</p>
                <SplitText as="h2" className="text-3xl lg:text-5xl font-black uppercase tracking-tight text-neutral-900 dark:text-white">En rebajas</SplitText>
              </div>
              <Link href="/productos?filter=ofertas" className="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black dark:hover:text-white hover-line transition-colors hidden sm:block">Ver todo →</Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6 lg:gap-y-14 stagger-children">
            {onSale.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ─── SPLIT BANNER ─── */}
      <Reveal>
        <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
          <div className="bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-12 lg:p-20 order-2 lg:order-1">
            <div className="max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-4">Temporada</p>
              <SplitText as="h2" className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-6">Ofertas exclusivas</SplitText>
              <p className="text-neutral-500 text-sm leading-relaxed mb-8">Stock limitado — cuando se acaben, se acaben.</p>
              <Link href="/productos?filter=ofertas" className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-8 py-4 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">
                Comprar ahora <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
          <div className="relative min-h-[400px] order-1 lg:order-2 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&q=80" alt="" className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
        </section>
      </Reveal>

      {/* ─── RECENTLY VIEWED ─── */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-12">
        <RecentlyViewed />
      </section>

      {/* ─── INSTAGRAM ─── */}
      <InstagramFeed />

      {/* ─── NEWSLETTER ─── */}
      <Reveal>
        <section className="bg-black dark:bg-white text-white dark:text-black py-20 lg:py-28">
          <div className="max-w-xl mx-auto px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400 mb-4">Newsletter</p>
            <SplitText as="h2" className="text-3xl lg:text-4xl font-black uppercase tracking-tight mb-4">No te pierdas nada</SplitText>
            <p className="text-neutral-400 dark:text-neutral-600 text-sm mb-8">Ofertas exclusivas y novedades directas a tu email.</p>
            {newsletterStatus === 'success' ? (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 dark:text-green-700 py-4 px-6 text-sm font-medium">¡Suscrito!</div>
            ) : (
              <form onSubmit={handleNewsletter} className="flex">
                <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="Tu email" required className="flex-1 bg-transparent border border-neutral-700 dark:border-neutral-300 px-5 py-4 text-sm text-white dark:text-black placeholder-neutral-500 focus:outline-none focus:border-white dark:focus:border-black" />
                <button type="submit" disabled={newsletterStatus === 'loading'} className="bg-white dark:bg-black text-black dark:text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50">
                  {newsletterStatus === 'loading' ? '...' : 'Suscribir'}
                </button>
              </form>
            )}
          </div>
        </section>
      </Reveal>

      <Footer />

      {/* Quick View Modal */}
    </div>
  );
}
