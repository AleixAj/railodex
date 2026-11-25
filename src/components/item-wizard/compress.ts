/**
 * Turns a camera photo into two WebP files: one up to 1600px for the ficha and a
 * 480px thumbnail for lists and cards (around 25 KB instead of 250). Supabase's free
 * plan only has 1 GB of storage, and small files make every list load much faster.
 */
export async function compressImage(file: File): Promise<{ full: Blob; thumb: Blob }> {
  const bitmap = await createImageBitmap(file);
  try {
    const full = await resize(bitmap, 1600, 0.82);
    const thumb = await resize(bitmap, 480, 0.75);
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
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("No se ha podido procesar la foto");
  return blob;
}
