import Navbar from '../components/Navbar';
import Link from 'next/link';
import { Cpu, Zap, ShieldCheck, ArrowRight, HardDrive, Play, RefreshCw } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section style={{ padding: '80px 24px', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '13px', color: '#60a5fa', marginBottom: '24px' }}>
            <Zap className="w-4 h-4" /> Next-Gen Cloud Architecture for High-Volume Media
          </div>

          <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: 1.15, marginBottom: '20px' }}>
            Distributed Cloud Media <br />
            <span className="gradient-text">Processing Platform</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '36px', maxWidth: '720px', margin: '0 auto 36px auto' }}>
            Engineered with Node.js microservices, Next.js App Router, BullMQ queues, and Sharp/FFmpeg processing engines. Transform images and transcode videos asynchronously with fault-tolerant scaling.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link href="/dashboard" className="btn-primary" style={{ fontSize: '16px', padding: '14px 28px' }}>
              Launch Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Specifications & Architecture Grid */}
      <section style={{ padding: '40px 24px 80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }} className="gradient-text">
          Core Engine Specifications
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>API Gateway & Auth</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Express REST API handling JWT authentication, request rate limiting, file uploads, and MongoDB state persistence.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>BullMQ & Redis Queue</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Decoupled queue producers & consumers with exponential backoff retries, concurrency controls, and real-time status reporting.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Play className="w-5 h-5 text-cyan-400" />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Image & Video Microservices</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Dedicated microservices executing Sharp (WebP/AVIF/Watermark) and Fluent-FFmpeg (Resolution scaling/Transcode/Thumbnails).
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <HardDrive className="w-5 h-5 text-green-400" />
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Abstract Storage Interface</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Pluggable storage driver (`IStorageProvider`) enabling seamless switching between Local File System and AWS S3.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
