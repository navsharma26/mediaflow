import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import path from 'path';
import fs from 'fs-extra';
import { VideoTaskConfig } from '@mediaflow/shared-types';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export function processVideoFile(
  inputPath: string,
  outputPath: string,
  config: VideoTaskConfig,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.ensureDirSync(path.dirname(outputPath));
    const command = ffmpeg(inputPath);

    if (config.taskType === 'extract_thumbnail') {
      const timestamp = config.thumbnailTimestampSec || 1;
      command
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '640x360',
        })
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err));
      return;
    }

    // Resolution scaling
    if (config.targetResolution) {
      switch (config.targetResolution) {
        case '1080p':
          command.size('1920x1080');
          break;
        case '720p':
          command.size('1280x720');
          break;
        case '480p':
          command.size('854x480');
          break;
        case '360p':
          command.size('640x360');
          break;
      }
    }

    // Format & Video Codec
    if (config.targetFormat) {
      command.toFormat(config.targetFormat);
      if (config.targetFormat === 'mp4') {
        command.videoCodec('libx264').audioCodec('aac');
      }
    }

    // Bitrate limit
    if (config.bitrateKbps) {
      command.videoBitrate(`${config.bitrateKbps}k`);
    }

    command
      .on('progress', (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.min(99, Math.round(progress.percent)));
        }
      })
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .save(outputPath);
  });
}
