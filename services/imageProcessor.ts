
import { ProcessedImage } from '../types';

const A4_WIDTH = 595;
const A4_HEIGHT = 842;

export const processImages = async (
  files: File[],
  onProgress: (progress: { current: number; total: number }) => void
): Promise<ProcessedImage[]> => {
  const processedImages: ProcessedImage[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    try {
      onProgress({ current: i + 1, total });
      const processedImage = await processSingleImage(file);
      processedImages.push(processedImage);
    } catch (error) {
      throw new Error(`Failed to process image ${file.name}: ${error}`);
    }
  }
  return processedImages;
};

const processSingleImage = (file: File): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = A4_WIDTH;
        canvas.height = A4_HEIGHT;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject('Could not get canvas context');
        }

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

        const hRatio = A4_WIDTH / img.width;
        const vRatio = A4_HEIGHT / img.height;
        const ratio = Math.min(hRatio, vRatio);
        
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        const x = (A4_WIDTH - newWidth) / 2;
        const y = (A4_HEIGHT - newHeight) / 2;

        ctx.drawImage(img, 0, 0, img.width, img.height, x, y, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject('Canvas toBlob failed');
            }
            const dataUrl = canvas.toDataURL('image/png');
            const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".png";
            resolve({ name: newFileName, dataUrl, blob });
          },
          'image/png',
          1.0
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
