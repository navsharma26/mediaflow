'use client';

import Link from 'next/link';
import { Cpu, Layers, Activity, HardDrive } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="glass-nav sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 style-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold gradient-text">MediaFlow</span>
            <span className="block text-[10px] text-gray-400 font-mono">DISTRIBUTED CLOUD ENGINE</span>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition">
            <Layers className="w-4 h-4 text-blue-400" />
            Asset Library
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition">
            <Activity className="w-4 h-4 text-purple-400" />
            Job Queue Monitor
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/80 border border-gray-800 text-xs font-mono text-cyan-400">
            <HardDrive className="w-3.5 h-3.5" />
            Storage: Local FS
          </div>
        </nav>
      </div>
    </header>
  );
}
