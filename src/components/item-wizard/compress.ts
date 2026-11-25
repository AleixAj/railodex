/**
 * Turns a camera photo into two WebP files: one up to 1600px for the ficha and a
 * 800px thumbnail for lists and cards (around 60 KB instead of 250; 480 looked soft on
 * phones and high-density screens, where a card is ~400px wide at 2-3x). Supabase's free
 * plan only has 1 GB of storage, and small files make every list load much faster.
 */
export async function compressImage(file: File): Promise<{ full: Blob; thumb: Blob }> {
  const bitmap = await createImageBitmap(file);
  try {
    const full = await resize(bitmap, 1600, 0.82);
    const thumb = await resize(bitmap, 800, 0.78);
    return { full, thumb };
  } finally {
    bitmap.close();
  }
}

async function resize(bitmap: ImageBitmap, maxSide: number, quality: number) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  // The default smoothing is tuned for speed and leaves downscaled photos a bit soft.
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("No se ha podido procesar la foto");
  return blob;
}
