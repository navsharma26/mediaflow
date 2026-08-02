import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';
import { ImageTaskConfig } from '@mediaflow/shared-types';

export async function processImageFile(
  inputPath: string,
  outputPath: string,
  config: ImageTaskConfig
): Promise<sharp.OutputInfo> {
  let pipeline = sharp(inputPath);

  // Determine dimensions (Default to 200x200 thumbnail if taskType is thumbnail or unspecified width/height)
  const targetWidth = config.width || (config.taskType === 'thumbnail' ? 200 : 800);
  const targetHeight = config.height || (config.taskType === 'thumbnail' ? 200 : 800);

  pipeline = pipeline.resize(targetWidth, targetHeight, {
    fit: 'cover',
    position: 'center',
  });

  // SVG Text Watermark Overlay
  const watermarkText = config.watermarkText || 'MediaFlow Watermark';
  const svgWatermark = Buffer.from(`
    <svg width="${targetWidth}" height="${targetHeight}">
      <style>
        .title { fill: rgba(255, 255, 255, 0.7); font-size: 16px; font-family: sans-serif; font-weight: bold; }
      </style>
      <text x="15" y="${targetHeight - 15}" class="title">${watermarkText}</text>
    </svg>
  `);

  pipeline = pipeline.composite([
    {
      input: svgWatermark,
      gravity: 'southeast',
    },
  ]);

  // Format conversion (default to PNG / JPEG / WebP based on config)
  if (config.format === 'webp') {
    pipeline = pipeline.webp({ quality: config.quality || 80 });
  } else if (config.format === 'avif') {
    pipeline = pipeline.avif({ quality: config.quality || 80 });
  } else if (config.format === 'png') {
    pipeline = pipeline.png();
  } else {
    pipeline = pipeline.jpeg({ quality: config.quality || 85 });
  }

  await fs.ensureDir(path.dirname(outputPath));
  return pipeline.toFile(outputPath);
}
