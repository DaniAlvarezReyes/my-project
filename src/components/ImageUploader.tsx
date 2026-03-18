'use client';
import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  maxFiles?: number;
  bucketName?: string;
  folder?: string;
}

export default function ImageUploader({
  onImageUploaded,
  maxFiles = 5,
  bucketName = 'product-images',
  folder = 'products',
}: ImageUploaderProps) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      ).slice(0, maxFiles);

      if (files.length > 0) {
        await uploadFiles(files);
      } else {
        toast.warning('Por favor selecciona solo archivos de imagen');
      }
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).slice(0, maxFiles);
      await uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);

    try {
      const urls: string[] = [];

      for (const file of files) {
        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.warning(`${file.name} es muy grande (máx. 5MB)`);
          continue;
        }

        // Validar tipo
        if (!file.type.startsWith('image/')) {
          toast.warning(`${file.name} no es una imagen válida`);
          continue;
        }

        // Generar nombre único
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        console.log(`📤 Subiendo: ${file.name} como ${filePath}`);

        // Subir a Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('❌ Error al subir:', error);
          
          // Mensajes de error específicos
          if (error.message.includes('not found')) {
            toast.error('Bucket de imágenes no encontrado');
          } else if (error.message.includes('permission')) {
            toast.error('Sin permisos para subir imágenes');
          } else {
            toast.error(`Error al subir ${file.name}`);
          }
          continue;
        }

        console.log('✅ Archivo subido:', data.path);

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        console.log('🔗 URL pública:', publicUrl);

        urls.push(publicUrl);
        setUploadedImages(prev => [...prev, publicUrl]);
        onImageUploaded(publicUrl);
      }

      if (urls.length > 0) {
        toast.success(`${urls.length} imagen(es) subida(s)`);
      }
    } catch (error: any) {
      console.error('❌ Error general:', error);
      toast.error('Error al subir imágenes');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const removeImage = (url: string) => {
    setUploadedImages(prev => prev.filter(img => img !== url));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Subiendo imágenes...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <button
                type="button"
                onClick={onButtonClick}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Haz clic para subir
              </button>
              <span className="text-gray-600"> o arrastra y suelta</span>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF hasta 5MB (máx. {maxFiles} archivos)
            </p>
          </div>
        )}
      </div>

      {/* Preview de imágenes subidas */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Imágenes subidas:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {uploadedImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Subida ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded truncate">
                  {url.split('/').pop()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex gap-2">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Consejos:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Las imágenes se suben a: <code className="bg-blue-100 px-1 rounded">{bucketName}/{folder}/</code></li>
              <li>El bucket debe ser público en Supabase Storage</li>
              <li>Tamaño máximo: 5MB por imagen</li>
              <li>Formatos: JPG, PNG, GIF, WEBP</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
