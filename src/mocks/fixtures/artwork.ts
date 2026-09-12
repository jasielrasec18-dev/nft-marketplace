const artwork: Record<string, string> = {
  golden: "/artwork/golden.png",
  jungle: "/artwork/jungle.png",
  cosmic: "/artwork/cosmic.png",
  pixel: "/artwork/pixel.png",
};
export function demoArtwork(collection: string) {
  return artwork[collection] ?? "/artwork/default.png";
}
