-- INSERTAR PRODUCTOS EN SUPABASE
-- Ejecutar después del schema

INSERT INTO products (id, name, description, price, original_price, images, category, subcategory, brand, rating, reviews, in_stock, stock, sizes, colors, badge) VALUES

-- RUNNING
('nike-pegasus-40', 'Nike Air Zoom Pegasus 40', 'Las Pegasus 40 ofrecen una amortiguación reactiva y duradera para tus entrenamientos diarios. Con malla mejorada y diseño actualizado.', 139.99, 159.99, 
  ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop'], 
  'running', 'carretera', 'Nike', 4.8, 456, true, 45, ARRAY['39', '40', '41', '42', '43', '44', '45'], ARRAY['Negro', 'Blanco', 'Azul'], 'POPULAR'),

('adidas-ultraboost-light', 'Adidas Ultraboost Light', 'La zapatilla de running más ligera de la familia Ultraboost. Amortiguación Boost responsiva y upper Primeknit adaptable.', 189.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop'], 
  'running', 'carretera', 'Adidas', 4.9, 623, true, 32, ARRAY['39', '40', '41', '42', '43', '44', '45', '46'], ARRAY['Blanco', 'Negro', 'Gris'], 'NUEVO'),

('asics-gel-nimbus-25', 'Asics Gel-Nimbus 25', 'Máxima amortiguación para largas distancias. Tecnología GEL en talón y antepié para una pisada suave.', 169.99, 189.99, 
  ARRAY['https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=800&fit=crop'], 
  'running', 'carretera', 'Asics', 4.7, 234, true, 28, ARRAY['40', '41', '42', '43', '44', '45'], ARRAY['Azul', 'Negro', 'Rojo'], NULL),

('hoka-speedgoat-5', 'Hoka Speedgoat 5', 'Diseñada para trail running. Suela Vibram Megagrip para máxima tracción en terrenos técnicos.', 159.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop'], 
  'running', 'trail', 'Hoka', 4.8, 189, true, 15, ARRAY['40', '41', '42', '43', '44'], ARRAY['Verde', 'Naranja', 'Gris'], 'POPULAR'),

-- LIFESTYLE
('nike-air-force-1', 'Nike Air Force 1 ''07', 'El clásico atemporal. Diseño icónico desde 1982, perfecto para el día a día con estilo urbano.', 119.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop'], 
  'lifestyle', 'casual', 'Nike', 4.9, 1245, true, 156, ARRAY['38', '39', '40', '41', '42', '43', '44', '45', '46'], ARRAY['Blanco', 'Negro', 'Blanco/Negro'], 'POPULAR'),

('adidas-samba-og', 'Adidas Samba OG', 'Ícono del fútbol sala convertido en zapatilla lifestyle. Piel premium y suela de goma.', 109.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop'], 
  'lifestyle', 'retro', 'Adidas', 4.8, 892, true, 89, ARRAY['38', '39', '40', '41', '42', '43', '44', '45'], ARRAY['Negro/Blanco', 'Blanco/Verde'], 'POPULAR'),

('new-balance-550', 'New Balance 550', 'Inspiradas en el baloncesto de los 80. Diseño retro con máximo confort para el uso diario.', 129.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=800&fit=crop'], 
  'lifestyle', 'retro', 'New Balance', 4.7, 445, true, 67, ARRAY['39', '40', '41', '42', '43', '44', '45'], ARRAY['Blanco/Verde', 'Blanco/Azul', 'Gris'], 'NUEVO'),

('vans-old-skool', 'Vans Old Skool', 'El clásico skate shoe. Suela waffle signature y construcción duradera.', 79.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop'], 
  'skateboarding', NULL, 'Vans', 4.8, 678, true, 134, ARRAY['38', '39', '40', '41', '42', '43', '44', '45'], ARRAY['Negro/Blanco', 'Azul Marino', 'Rojo'], NULL),

-- BASKETBALL
('air-jordan-1-high', 'Air Jordan 1 Retro High OG', 'La leyenda que empezó todo. Diseño clásico de 1985, perfecto tanto para la cancha como para la calle.', 189.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop'], 
  'basketball', 'cana-alta', 'Nike', 5.0, 2134, true, 23, ARRAY['40', '41', '42', '43', '44', '45'], ARRAY['Chicago', 'Bred', 'Royal'], 'POPULAR'),

('lebron-21', 'Nike LeBron 21', 'La última firma de LeBron. Tecnología Zoom Air para explosividad y soporte en la cancha.', 179.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop'], 
  'basketball', 'cana-baja', 'Nike', 4.7, 234, true, 34, ARRAY['41', '42', '43', '44', '45', '46'], ARRAY['Negro', 'Morado', 'Blanco'], 'NUEVO'),

-- TRAINING
('nike-metcon-9', 'Nike Metcon 9', 'Diseñada para entrenamientos de alta intensidad. Estabilidad y durabilidad para levantamientos.', 149.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop'], 
  'training', 'crossfit', 'Nike', 4.8, 567, true, 45, ARRAY['39', '40', '41', '42', '43', '44', '45'], ARRAY['Negro', 'Blanco', 'Azul'], NULL),

('reebok-nano-x3', 'Reebok Nano X3', 'La zapatilla de CrossFit por excelencia. Versatilidad para cualquier WOD.', 139.99, 159.99, 
  ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop'], 
  'training', 'crossfit', 'Reebok', 4.7, 445, true, 56, ARRAY['39', '40', '41', '42', '43', '44', '45'], ARRAY['Negro', 'Gris', 'Azul'], 'OFERTA'),

-- FÚTBOL
('nike-mercurial-superfly', 'Nike Mercurial Superfly 9', 'Velocidad pura. Diseño aerodinámico y sistema de tracción optimizado.', 279.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=800&fit=crop'], 
  'futbol', 'cesped-natural', 'Nike', 4.9, 334, true, 12, ARRAY['39', '40', '41', '42', '43', '44', '45'], ARRAY['Naranja', 'Negro', 'Blanco'], 'NUEVO'),

('adidas-predator-accuracy', 'Adidas Predator Accuracy.1', 'Control y precisión absolutos. Zonas de strike para efectos en el balón.', 259.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=800&fit=crop'], 
  'futbol', 'cesped-natural', 'Adidas', 4.8, 267, true, 18, ARRAY['39', '40', '41', '42', '43', '44'], ARRAY['Blanco/Rojo', 'Negro'], NULL),

('puma-future-z', 'Puma Future Z 1.4', 'Agilidad extrema. Sistema de lazado adaptativo para ajuste personalizado.', 229.99, 269.99, 
  ARRAY['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=800&fit=crop'], 
  'futbol', 'cesped-artificial', 'Puma', 4.6, 189, true, 24, ARRAY['40', '41', '42', '43', '44', '45'], ARRAY['Amarillo', 'Azul'], 'OFERTA'),

('converse-chuck-taylor', 'Converse Chuck Taylor All Star', 'El clásico de clásicos. Atemporal, versátil y cómodo para cualquier ocasión.', 69.99, NULL, 
  ARRAY['https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?w=800&h=800&fit=crop'], 
  'lifestyle', 'casual', 'Converse', 4.9, 3456, true, 234, ARRAY['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], ARRAY['Negro', 'Blanco', 'Rojo', 'Azul Marino'], 'POPULAR');
