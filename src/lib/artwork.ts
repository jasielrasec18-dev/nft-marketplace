export function artworkSources(src: string, sizes: string) {
  if (!/^\/artwork\/(golden|jungle|cosmic|pixel|default)-768\.webp$/.test(src)) return {}
  return { srcSet: src.replace('-768.webp', '-384.webp') + ' 384w, ' + src + ' 768w', sizes }
}
