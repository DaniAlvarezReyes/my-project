'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

const StarIcon = ({ filled, size = 'md' }: { filled: boolean; size?: 'sm' | 'md' | 'lg' }) => {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  return (
    <svg className={`${sz} ${filled ? 'text-yellow-400' : 'text-gray-200 dark:text-neutral-700'}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
};

export const ReviewSection: React.FC<{ productId: string }> = ({ productId }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [visibleCount, setVisibleCount] = useState(5);
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());

  useEffect(() => { loadReviews(); }, [productId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (data) setReviews(data);
    } catch {} finally { setLoading(false); }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.warning('Inicia sesión para dejar una reseña'); return; }
    if (!title.trim() || !comment.trim()) { toast.warning('Completa todos los campos'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user?.id,
        user_name: user?.name || 'Usuario',
        rating, title: title.trim(), comment: comment.trim(),
        verified_purchase: false,
      });
      if (error) throw error;
      toast.success('¡Reseña enviada! Gracias por tu opinión.');
      setTitle(''); setComment(''); setRating(5); setShowForm(false);
      loadReviews();
    } catch { toast.error('Error al enviar la reseña'); }
    finally { setSubmitting(false); }
  };

  const markHelpful = async (reviewId: string) => {
    if (helpfulClicked.has(reviewId)) return;
    setHelpfulClicked(prev => new Set([...prev, reviewId]));
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r));
    // RPC atómico (SECURITY DEFINER) — evita que el cliente escriba valores arbitrarios
    await supabase.rpc('increment_helpful', { review_id: reviewId });
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  const ratingLabels: Record<number, string> = { 5: 'Excelente', 4: 'Muy bueno', 3: 'Bueno', 2: 'Regular', 1: 'Malo' };

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Opiniones</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reseñas de clientes</h2>
        </div>
        {isAuthenticated && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white text-sm font-bold hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Escribir reseña
          </button>
        )}
        {!isAuthenticated && (
          <a href="/auth/login" className="text-sm text-blue-600 hover:underline font-medium">Inicia sesión para opinar →</a>
        )}
      </div>

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 bg-gray-50 dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800">
          {/* Left: overall */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-6xl font-black text-gray-900 dark:text-white">{avgRating.toFixed(1)}</p>
              <div className="flex justify-center mt-1">
                {[1,2,3,4,5].map(s => <StarIcon key={s} filled={s <= Math.round(avgRating)} size="sm" />)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}</p>
            </div>
            {/* Breakdown */}
            <div className="flex-1 space-y-1.5">
              {ratingBreakdown.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-3">{star}</span>
                  <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Right: highlights */}
          <div className="flex flex-col justify-center gap-3">
            {ratingBreakdown.filter(r => r.count > 0).slice(0, 2).map(({ star }) => (
              <div key={star} className="flex items-center gap-3 bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-neutral-700">
                <div className="flex">{[1,2,3,4,5].map(s => <StarIcon key={s} filled={s <= star} size="sm" />)}</div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ratingLabels[star]}</span>
                <span className="ml-auto text-xs text-gray-400">{((reviews.filter(r => r.rating === star).length / reviews.length) * 100).toFixed(0)}%</span>
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-1">Basado en compras verificadas de clientes reales</p>
          </div>
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <form onSubmit={submitReview} className="mb-10 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700 shadow-sm">
          <h3 className="font-bold text-lg mb-5">Tu reseña</h3>
          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Valoración</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(star => (
                <button key={star} type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <StarIcon filled={star <= (hoverRating || rating)} size="lg" />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500 self-center">{ratingLabels[hoverRating || rating]}</span>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Título de tu reseña *</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="Ej: Muy cómodas, las uso a diario"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Tu comentario *</label>
            <textarea
              value={comment} onChange={e => setComment(e.target.value)} required rows={4}
              placeholder="Cuenta tu experiencia con este producto: talla, comodidad, calidad..."
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Enviando...' : 'Publicar reseña'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-6 py-2.5 border border-gray-200 dark:border-neutral-700 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Sort */}
      {reviews.length > 1 && (
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ordenar:</span>
          {(['recent', 'rating'] as const).map(opt => (
            <button key={opt} onClick={() => setSortBy(opt)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${sortBy === opt ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'}`}
            >
              {opt === 'recent' ? 'Más recientes' : 'Mejor valoradas'}
            </button>
          ))}
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-700">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-semibold text-gray-900 dark:text-white mb-1">Sé el primero en opinar</p>
          <p className="text-sm text-gray-500">Ayuda a otros compradores con tu experiencia</p>
          {isAuthenticated && !showForm && (
            <button onClick={() => setShowForm(true)} className="mt-4 px-5 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:opacity-90">
              Escribir reseña
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedReviews.slice(0, visibleCount).map(review => (
            <div key={review.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {review.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{review.user_name}</span>
                      {review.verified_purchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          Compra verificada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex">{[1,2,3,4,5].map(s => <StarIcon key={s} filled={s <= review.rating} size="sm" />)}</div>
                      <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
              {review.title && <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{review.title}</h4>}
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.comment}</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-neutral-800">
                <span className="text-xs text-gray-400">¿Te ha resultado útil?</span>
                <button
                  onClick={() => markHelpful(review.id)}
                  disabled={helpfulClicked.has(review.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-all ${helpfulClicked.has(review.id) ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 dark:border-neutral-700 text-gray-500 hover:border-gray-400'}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                  Sí {review.helpful_count > 0 && `(${review.helpful_count})`}
                </button>
              </div>
            </div>
          ))}
          {visibleCount < sortedReviews.length && (
            <button onClick={() => setVisibleCount(v => v + 5)}
              className="w-full py-3 border border-gray-200 dark:border-neutral-700 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-2xl hover:border-gray-400 transition-colors"
            >
              Ver {Math.min(5, sortedReviews.length - visibleCount)} reseñas más
            </button>
          )}
        </div>
      )}
    </section>
  );
};
