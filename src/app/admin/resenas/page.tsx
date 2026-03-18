'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/components/ConfirmDialog';

export default function AdminReviews() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const toast = useToast();
  const { confirm } = useConfirm();

  useEffect(() => { loadComments(); }, []);

  const loadComments = async () => {
    try {
      const { data } = await supabase
        .from('product_comments')
        .select('*, product:products(name, images)')
        .order('created_at', { ascending: false });
      if (data) setComments(data);
    } catch (err) {
      console.warn('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar comentario',
      message: '¿Eliminar este comentario permanentemente?',
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await supabase.from('product_comments').delete().eq('id', id);
      setComments(prev => prev.filter(c => c.id !== id));
      toast.success('Comentario eliminado');
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const toggleVerified = async (id: string, current: boolean) => {
    try {
      await supabase.from('product_comments').update({ verified_purchase: !current }).eq('id', id);
      setComments(prev => prev.map(c => c.id === id ? { ...c, verified_purchase: !current } : c));
      toast.success(current ? 'Verificación removida' : 'Marcado como compra verificada');
    } catch (err) {
      toast.error('Error al actualizar');
    }
  };

  const filteredComments = comments.filter(c => {
    if (filter === 'verified') return c.verified_purchase;
    if (filter === 'unverified') return !c.verified_purchase;
    if (filter === 'low') return c.rating <= 2;
    return true;
  });

  const avgRating = comments.length > 0
    ? (comments.reduce((s, c) => s + (c.rating || 0), 0) / comments.length).toFixed(1)
    : '0.0';

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reseñas y Comentarios</h1>
          <p className="text-sm text-gray-500">{comments.length} comentarios · Valoración media: ⭐ {avgRating}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">{comments.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">{comments.filter(c => c.verified_purchase).length}</p>
          <p className="text-xs text-gray-500">Verificados</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-amber-600">⭐ {avgRating}</p>
          <p className="text-xs text-gray-500">Media</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-red-600">{comments.filter(c => c.rating <= 2).length}</p>
          <p className="text-xs text-gray-500">Negativas (≤2⭐)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'verified', label: 'Verificados' },
          { key: 'unverified', label: 'Sin verificar' },
          { key: 'low', label: 'Negativas' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-400">No hay comentarios en esta categoría</p>
          </div>
        ) : (
          filteredComments.map(comment => (
            <div key={comment.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                {/* Product thumbnail */}
                {comment.product?.images?.[0] && (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={comment.product.images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{comment.user_name}</p>
                      <p className="text-xs text-gray-500">
                        {comment.product?.name} · {new Date(comment.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Stars */}
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className={`w-4 h-4 ${s <= (comment.rating || 0) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      {comment.verified_purchase && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✓ Verificado</span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mt-2">{comment.comment}</p>

                  {/* Images */}
                  {comment.images && comment.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {comment.images.map((img: string, i: number) => (
                        <div key={i} className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                    <button
                      onClick={() => toggleVerified(comment.id, comment.verified_purchase)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        comment.verified_purchase
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {comment.verified_purchase ? 'Quitar verificación' : '✓ Verificar compra'}
                    </button>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
