'use client';

import { IAsset } from '@mediaflow/shared-types';
import { Image as ImageIcon, Video, CheckCircle2, Clock, AlertTriangle, ExternalLink, HardDrive } from 'lucide-react';

interface AssetCardProps {
  asset: IAsset;
}

export default function AssetCard({ asset }: AssetCardProps) {
  const isImage = asset.mediaType === 'image';
  
  // Format status badge text
  let statusText: string = asset.status;
  if (asset.status === 'pending') statusText = 'Queued';
  else if (asset.status === 'processed') statusText = 'Completed';


  const previewUrl = asset.processed_url || asset.original_url;

  return (
    <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', transition: 'all 0.2s ease' }}>
      {/* Card Header & Status Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: isImage ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.15)' }}>
            {isImage ? <ImageIcon className="w-4 h-4 text-blue-400" /> : <Video className="w-4 h-4 text-purple-400" />}
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {asset.mediaType}
          </span>
        </div>

        <span className={`badge badge-${asset.status === 'processed' ? 'completed' : asset.status}`}>
          {statusText}
        </span>
      </div>

      {/* Thumbnail Placeholder / Image Preview */}
      <div
        style={{
          width: '100%',
          height: '140px',
          borderRadius: '8px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={asset.filename}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // Fallback to placeholder if image fails to render
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            <HardDrive className="w-8 h-8 opacity-40" style={{ margin: '0 auto 6px auto' }} />
            <span>Thumbnail Placeholder</span>
          </div>
        )}
      </div>

      {/* File Info */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={asset.filename}>
          {asset.filename}
        </h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>Size: {asset.metadata?.size ? (asset.metadata.size / 1024 / 1024).toFixed(2) + ' MB' : 'Placeholder'}</span>
          <span>Key: {asset.storageKey.substring(0, 15)}...</span>
        </div>
      </div>

      {/* Download / View Link */}
      {asset.processed_url ? (
        <a
          href={asset.processed_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: 'var(--success-green)',
            fontSize: '12px',
            fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          View Processed Asset <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
          {asset.status === 'processing' ? 'Processing worker running...' : 'Awaiting job dispatch'}
        </div>
      )}
    </div>
  );
}
