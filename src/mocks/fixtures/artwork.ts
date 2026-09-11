const artwork: Record<string, string> = {
  golden: '/artwork/golden.svg',
  jungle: '/artwork/jungle.svg',
  cosmic: '/artwork/cosmic.svg',
  pixel: '/artwork/pixel.svg',
}
export function demoArtwork(collection: string) { return artwork[collection] ?? '/artwork/golden.svg' }
