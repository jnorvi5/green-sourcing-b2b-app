'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaPlay } from 'react-icons/fa';

export default function PluginDemoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
            See the Plugin in Action
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Watch how easily you can audit and optimize your Revit models.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10 border border-slate-800">
          {!isPlaying ? (
            <div className="absolute inset-0 group cursor-pointer" onClick={() => setIsPlaying(true)}>
              <Image
                src="/images/plugin/demo-thumbnail.svg"
                alt="Plugin Demo"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center pl-2 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <FaPlay className="text-white text-3xl" />
                </div>
              </div>
            </div>
          ) : (
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="GreenChainz Revit Plugin Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            ></iframe>
          )}
        </div>
      </div>
    </section>
  );
}
