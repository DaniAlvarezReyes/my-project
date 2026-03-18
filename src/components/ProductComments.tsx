'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import ImageLightbox from './ImageLightbox';

interface Comment {
  id: string;
  user_name: string;
  user_email?: string;
  rating: number;
  comment: string;
  images: string[];
  verified_purchase: boolean;
  created_at: string;
}

interface ProductCommentsProps {
  productId: string;
}

export const ProductComments: React.FC<ProductCommentsProps> = ({ productId }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [productId]);

  const loadComments = async (retries = 2) => {
    try {
      const { data, error } = await supabase
        .from('product_comments')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) {
        // Retry on empty errors (lock timeout cascade)
        if (retries > 0 && !error.message) {
          await new Promise(r => setTimeout(r, 800));
          return loadComments(retries - 1);
        }
        // Table might not exist - fail silently
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          setComments([]);
          setLoading(false);
          return;
        }
        console.warn('Error loading comments:', error.message || error.code);
        setLoading(false);
        return;
      }
      
      if (data) setComments(data);
    } catch (error) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 800));
        return loadComments(retries - 1);
      }
      // Fail silently - comments are not critical
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + imageFiles.length > 3) {
      toast.warning('Máximo 3 imágenes por comentario');
      return;
    }

    setImageFiles([...imageFiles, ...files]);
    
    // Crear previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    console.log('📸 Iniciando subida de', imageFiles.length, 'imágenes...');
    const uploadedUrls: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `comments/${fileName}`;

        console.log(`📤 Subiendo imagen ${i + 1}/${imageFiles.length}:`, fileName);

        // Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Error al subir:', uploadError);
          throw uploadError;
        }

        console.log('✅ Archivo subido:', uploadData.path);

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        console.log('🔗 URL pública generada:', publicUrl);
        uploadedUrls.push(publicUrl);

      } catch (error: any) {
        console.error('❌ Error en imagen:', error);
        console.error('Detalles:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error.error
        });
        
        // Mostrar error específico
        if (error.message?.includes('not found')) {
          toast.error('Bucket de imágenes no encontrado. Créalo en Supabase Storage.');
        } else if (error.message?.includes('permission')) {
          toast.error('Sin permisos para subir imágenes');
        } else {
          toast.error('Error al subir imagen');
        }
      }
    }

    console.log(`✅ Subida completada: ${uploadedUrls.length}/${imageFiles.length} imágenes`);
    return uploadedUrls;
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      toast.warning('Debes iniciar sesión para comentar');
      return;
    }

    if (commentText.trim().length < 10) {
      toast.warning('El comentario debe tener al menos 10 caracteres');
      return;
    }

    console.log('💬 Iniciando publicación de comentario...');
    setUploading(true);

    try {
      // Subir imágenes
      console.log('📸 Subiendo imágenes...');
      const imageUrls = await uploadImages();
      console.log('✅ Imágenes subidas:', imageUrls);

      // Guardar comentario
      console.log('💾 Guardando comentario en BD...');
      const commentData = {
        product_id: productId,
        user_id: user.id,
        user_name: user.name || 'Usuario',
        user_email: user.email,
        rating,
        comment: commentText,
        images: imageUrls,
        verified_purchase: false
      };
      
      console.log('Datos a guardar:', commentData);

      const { data, error } = await supabase
        .from('product_comments')
        .insert(commentData)
        .select();

      if (error) {
        console.error('❌ Error al guardar:', error);
        throw error;
      }

      console.log('✅ Comentario guardado:', data);

      // Limpiar formulario
      setCommentText('');
      setRating(5);
      setImageFiles([]);
      setImagePreviews([]);
      setShowForm(false);
      
      // Recargar comentarios
      await loadComments();
      
      toast.success('¡Comentario publicado!');
    } catch (error: any) {
      console.error('❌ Error posting comment:', error);
      console.error('Detalles completos:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      if (error.message?.includes('table')) {
        toast.error('Error al publicar comentario');
      } else {
        toast.error('Error al publicar comentario');
      }
    } finally {
      setUploading(false);
    }
  };

  const avgRating = comments.length > 0
    ? (comments.reduce((sum, c) => sum + c.rating, 0) / comments.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Comentarios</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${parseFloat(avgRating) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-600">{avgRating} ({comments.length} comentarios)</span>
          </div>
        </div>
        
        {!showForm && isAuthenticated && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ✍️ Escribir comentario
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={submitComment} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">Tu comentario</h3>
          
          {/* Rating */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Calificación</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <svg
                    className={`w-8 h-8 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Comentario */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Comentario</label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
              placeholder="Comparte tu experiencia con este producto..."
              required
            />
          </div>

          {/* Imágenes */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Fotos (opcional, máx. 3)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={imageFiles.length >= 3}
            />
            
            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-2 mt-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-20 h-20 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Publicando...' : 'Publicar comentario'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setCommentText('');
                setImageFiles([]);
                setImagePreviews([]);
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de comentarios */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aún no hay comentarios. ¡Sé el primero!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{comment.user_name}</span>
                    {comment.verified_purchase && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        ✓ Compra verificada
                      </span>
                    )}
                  </div>
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${comment.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
              
              <p className="text-gray-700 mb-2">{comment.comment}</p>
              
              {/* Imágenes del comentario */}
              {comment.images && comment.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {comment.images.map((image, idx) => (
                    <img
                      key={idx}
                      src={image}
                      alt={`Imagen ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded cursor-pointer hover:opacity-75 transition hover:ring-2 hover:ring-blue-500"
                      onClick={() => {
                        setLightboxImages(comment.images);
                        setLightboxIndex(idx);
                        setShowLightbox(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
};
