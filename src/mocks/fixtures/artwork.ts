const artwork: Record<string, string> = {
  golden: "/artwork/golden-768.webp",
  jungle: "/artwork/jungle-768.webp",
  cosmic: "/artwork/cosmic-768.webp",
  pixel: "/artwork/pixel-768.webp",
};
export function demoArtwork(collection: string) {
  return artwork[collection] ?? "/artwork/default-768.webp";
}
