import { toPng } from 'html-to-image';

async function waitForImages(root: HTMLElement) {
  const images = [...root.querySelectorAll('img')];
  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;
      try {
        await image.decode();
      } catch {
        // Fallback may already be rendered; export should still proceed.
      }
    }),
  );
}

export async function exportResultCard(element: HTMLElement, filename = 'ringpick-wedding-band-result.png') {
  await waitForImages(element);
  const dataUrl = await toPng(element, {
    width: 1080,
    height: 1350,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: '#f8f5f1',
  });
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = dataUrl;
  anchor.click();
  return dataUrl;
}
