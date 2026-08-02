'use client';

import { IJob } from '@mediaflow/shared-types';
import { Image as ImageIcon, Video, CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: IJob;
}

export default function JobCard({ job }: JobCardProps) {
  const isImage = job.type === 'image';

  return (
    <div className="glass-card" style={{ padding: '20px', transition: 'all 0.2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: isImage ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.15)' }}>
            {isImage ? <ImageIcon className="w-5 h-5 text-blue-400" /> : <Video className="w-5 h-5 text-purple-400" />}
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600' }}>
              {(job.type || 'IMAGE').toUpperCase()} - {(job.taskConfig as any).taskType || 'transform'}
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              BullMQ ID: {job.bullmq_id || job._id.substring(0, 12)}
            </span>
          </div>
        </div>


        <span className={`badge badge-${job.status}`}>
          {job.status}
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          <span>Execution Progress</span>
          <span>{job.progress}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${job.progress}%`,
              height: '100%',
              background: job.status === 'failed' ? 'var(--error-red)' : 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Result URL link if completed */}
      {job.status === 'completed' && job.outputPublicUrl && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--success-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 className="w-4 h-4" /> Ready for Download
          </span>
          <a
            href={job.outputPublicUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '500' }}
          >
            View Output <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Error display if failed */}
      {job.status === 'failed' && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', color: 'var(--error-red)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle className="w-4 h-4" /> {job.errorMessage || 'Execution failed'}
        </div>
      )}
    </div>
  );
}
