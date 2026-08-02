'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import AssetCard from '../../components/AssetCard';
import JobCard from '../../components/JobCard';
import { IJob, IAsset } from '@mediaflow/shared-types';
import { Plus, RefreshCw, Activity, Layers, Upload, CheckCircle2, Cpu } from 'lucide-react';
import { api } from '../../lib/api';

export default function DashboardPage() {
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchAssetsAndJobs = async () => {
    try {
      // Ensure user authentication token for demo session
      if (!localStorage.getItem('mediaflow_token')) {
        try {
          const authRes = await api.post('/auth/register', {
            email: 'demo@mediaflow.io',
            password: 'demopassword123',
            name: 'Demo Architect',
          });
          localStorage.setItem('mediaflow_token', authRes.data.token);
        } catch {
          const loginRes = await api.post('/auth/login', {
            email: 'demo@mediaflow.io',
            password: 'demopassword123',
          });
          localStorage.setItem('mediaflow_token', loginRes.data.token);
        }
      }

      const [assetsRes, jobsRes] = await Promise.all([
        api.get('/assets').catch(() => ({ data: [] })),
        api.get('/jobs').catch(() => ({ data: [] })),
      ]);

      setAssets(assetsRes.data);
      setJobs(jobsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard state:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time polling every 2 seconds for live status updates
  useEffect(() => {
    fetchAssetsAndJobs();
    const interval = setInterval(fetchAssetsAndJobs, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadIntentAndSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      setStatusMessage('Generating S3 Presigned Upload URL...');

      const isImage = selectedFile.type.startsWith('image/');
      const mediaType = isImage ? 'image' : 'video';
      const contentType = selectedFile.type || (isImage ? 'image/png' : 'video/mp4');

      // 1. Call POST /api/assets/upload-intent -> returns S3 Presigned URL
      const intentRes = await api.post('/assets/upload-intent', {
        filename: selectedFile.name,
        mimeType: contentType,
        mediaType,
        size: selectedFile.size,
      });

      const { assetId, uploadUrl } = intentRes.data;
      setStatusMessage(`S3 Presigned URL generated. Uploading directly to cloud storage...`);

      // 2. Upload file directly to S3 Presigned URL using axios.put
      const axiosLib = (await import('axios')).default;
      await axiosLib.put(uploadUrl, selectedFile, {
        headers: { 'Content-Type': contentType },
      });

      setStatusMessage('Cloud upload complete! Dispatching BullMQ worker job...');

      // 3. Create & Enqueue Processing Job
      await api.post('/jobs', {
        assetId,
        taskConfig: isImage
          ? { taskType: 'thumbnail', width: 200, height: 200, watermarkText: 'MediaFlow Cloud' }
          : { taskType: 'transcode', targetResolution: '720p', targetFormat: 'mp4' },
      });

      setStatusMessage('Job queued successfully! Worker processing...');
      setSelectedFile(null);
      await fetchAssetsAndJobs();
    } catch (err: any) {
      console.error('S3 Direct Upload error:', err);
      setStatusMessage(`Error: ${err.response?.data?.error || 'Direct cloud upload failed'}`);
    } finally {
      setUploading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };


  return (
    <div className="min-h-screen">
      <Navbar />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px' }}>
        {/* Header & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800' }} className="gradient-text">
              MediaFlow User Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Real-time media asset management and microservice queue monitoring.
            </p>
          </div>

          <button
            onClick={fetchAssetsAndJobs}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
            }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Auto-Polling Active (2s)
          </button>
        </div>

        {/* Upload Form Card */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '36px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }} className="gradient-text">
            Upload Asset & Trigger Microservice Workflow
          </h3>

          <form onSubmit={handleUploadIntentAndSimulate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="btn-primary"
                style={{ opacity: uploading || !selectedFile ? 0.5 : 1 }}
              >
                <Upload className="w-4 h-4" /> {uploading ? 'Processing Intent...' : 'Upload & Process'}
              </button>
            </div>

            {statusMessage && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity className="w-4 h-4 animate-pulse" /> {statusMessage}
              </div>
            )}
          </form>
        </div>

        {/* Assets Section */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Uploaded Asset Collection</h2>
            <span className="badge badge-processing">{assets.length} Assets</span>
          </div>

          {assets.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No assets uploaded yet. Use the upload form above to create your first asset.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {assets.map((asset) => (
                <AssetCard key={asset._id} asset={asset} />
              ))}
            </div>
          )}
        </div>

        {/* Live BullMQ Job Queue Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Cpu className="w-5 h-5 text-purple-400" />
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Microservice Job Execution Queue</h2>
            <span className="badge badge-completed">{jobs.length} Jobs Executed</span>
          </div>

          {jobs.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No jobs currently in queue.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
