const pdfExportIgnoreSelector = '[data-pdf-export-ignore]';

async function waitForPreviewAssets(element: HTMLElement) {
  const fonts = document.fonts?.ready;
  const images = Array.from(element.querySelectorAll('img'));

  await Promise.all([
    fonts?.catch(() => undefined),
    ...images.map((image) => {
      if (image.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      });
    }),
  ]);
}

export async function downloadElementPdf(element: HTMLElement, fileName: string) {
  await waitForPreviewAssets(element);

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    imageTimeout: 15000,
    logging: false,
    scale: Math.max(1.5, Math.min(window.devicePixelRatio || 1, 2)),
    useCORS: true,
    onclone: (clonedDocument) => {
      clonedDocument.querySelectorAll(pdfExportIgnoreSelector).forEach((node) => node.remove());
    },
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  const pageCanvas = document.createElement('canvas');
  const pageContext = pageCanvas.getContext('2d');
  const sliceHeight = Math.floor((contentHeight * canvas.width) / contentWidth);

  if (!pageContext) {
    throw new Error('PDF renderer could not prepare the document canvas');
  }

  pageCanvas.width = canvas.width;

  for (let sourceY = 0, pageIndex = 0; sourceY < canvas.height; sourceY += sliceHeight, pageIndex += 1) {
    const currentSliceHeight = Math.min(sliceHeight, canvas.height - sourceY);
    const imageHeight = (currentSliceHeight * contentWidth) / canvas.width;

    pageCanvas.height = currentSliceHeight;
    pageContext.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageContext.drawImage(canvas, 0, sourceY, canvas.width, currentSliceHeight, 0, 0, canvas.width, currentSliceHeight);

    if (pageIndex > 0) {
      pdf.addPage();
    }

    pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, imageHeight);
  }

  pdf.save(fileName);
}
