# Artes de demonstração

Os PNGs locais existentes são as fontes preservadas das artes usadas pela demo; não são exportações oficiais do Figma. Os SVGs anteriores permanecem como arquivos legados.

`node scripts/optimize-artwork.mjs` gera derivados WebP de 384 e 768 px, qualidade 82, sem recriar as imagens. A API fornece a versão de 768 px; componentes principais usam srcset. URLs antigas conhecidas são migradas na leitura da persistência, preservando imagens customizadas.
