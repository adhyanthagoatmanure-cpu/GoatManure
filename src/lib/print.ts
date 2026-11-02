export async function printAfterImagesLoaded(): Promise<void> {
  const images = Array.from(document.querySelectorAll<HTMLImageElement>(".print-label-logo"));

  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth > 0) {
      try {
        await image.decode();
      } catch {
        // Some browsers can decode successfully but reject their decode() promise.
      }
      return;
    }

    await new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });

    if (image.naturalWidth > 0) {
      try {
        await image.decode();
      } catch {
        // Continue printing even when decode() is unavailable or rejects.
      }
    }
  }));

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  window.print();
}
