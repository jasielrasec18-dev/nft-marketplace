import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
const directory = new URL('../public/artwork/', import.meta.url)
for (const name of ['golden', 'jungle', 'cosmic', 'pixel', 'default']) {
  for (const width of [384, 768]) {
    await sharp(fileURLToPath(new URL(name + '.png', directory))).resize(width, width, { fit: 'cover' }).webp({ quality: 82 }).toFile(fileURLToPath(new URL(name + '-' + width + '.webp', directory)))
  }
}
