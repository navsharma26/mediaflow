'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Video, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [taskType, setTaskType] = useState<string>('resize');
  const [format, setFormat] = useState<string>('webp');
  const [targetRes, setTargetRes] = useState<string>('720p');
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isVideo = file?.type.startsWith('video/');

  const handleUploadAndSubmit = async () => {
    if (!file) {
      setError('Please select a media file first.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Step 1: Upload asset to Gateway
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await api.post('/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const asset = uploadRes.data;

      // Step 2: Build Task Configuration & Create Job
      let taskConfig: any = {};
      if (asset.mediaType === 'image') {
        taskConfig = {
          taskType,
          format,
          width: taskType === 'thumbnail' ? 300 : 1280,
          quality: 85,
        };
      } else {
        taskConfig = {
          taskType: isVideo && taskType === 'thumbnail' ? 'extract_thumbnail' : 'transcode',
          targetResolution: targetRes,
          targetFormat: 'mp4',
        };
      }

      await api.post('/jobs', {
        assetId: asset._id,
        taskConfig,
      });

      setUploading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setUploading(false);
      setError(err.response?.data?.error || 'Upload or job submission failed');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '540px', padding: '24px', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
        >
          <X className="w-5 h-5" />
        </button>

        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }} className="gradient-text">
          Dispatch Media Processing Task
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Upload an image or video to dispatch an asynchronous job to the microservice worker pool.
        </p>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* File Dropzone */}
        <div
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '10px',
            padding: '28px',
            textAlign: 'center',
            backgroundColor: 'rgba(255,255,255,0.02)',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) setFile(e.target.files[0]);
            }}
          />
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {file.type.startsWith('image/') ? <ImageIcon className="w-6 h-6 text-blue-400" /> : <Video className="w-6 h-6 text-purple-400" />}
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{file.name}</span>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
          ) : (
            <div>
              <Upload className="w-8 h-8 text-gray-400" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ fontSize: '14px', fontWeight: '500' }}>Click or drag & drop media file here</p>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Supports PNG, JPG, WebP, MP4, MOV (up to 500MB)</p>
            </div>
          )}
        </div>

        {/* Preset Configuration Options */}
        {file && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {!isVideo ? (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '6px' }}>
                    Transformation Preset
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0d1117', border: '1px solid var(--border-color)', color: 'white', fontSize: '14px' }}
                  >
                    <option value="resize">Scale & Resize (1280px)</option>
                    <option value="convert">Format Conversion</option>
                    <option value="thumbnail">Generate Thumbnail (300px)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '6px' }}>
                    Target Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0d1117', border: '1px solid var(--border-color)', color: 'white', fontSize: '14px' }}
                  >
                    <option value="webp">WebP (Optimized Web)</option>
                    <option value="avif">AVIF (Next-Gen Compression)</option>
                    <option value="png">PNG (Lossless)</option>
                    <option value="jpeg">JPEG (Standard)</option>
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '6px' }}>
                  Video Transcode Resolution
                </label>
                <select
                  value={targetRes}
                  onChange={(e) => setTargetRes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#0d1117', border: '1px solid var(--border-color)', color: 'white', fontSize: '14px' }}
                >
                  <option value="1080p">1080p Full HD (1920x1080)</option>
                  <option value="720p">720p HD (1280x720)</option>
                  <option value="480p">480p SD (854x480)</option>
                  <option value="360p">360p Mobile (640x360)</option>
                </select>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>

          <button
            onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: '#9ca3af', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleUploadAndSubmit}
            disabled={uploading || !file}
            className="btn-primary"
            style={{ opacity: uploading || !file ? 0.5 : 1 }}
          >
            {uploading ? 'Processing & Queueing...' : 'Submit to Worker Pool'}
          </button>
        </div>
      </div>
    </div>
  );
}
