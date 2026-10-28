'use client';

import React from 'react';
import { Zap, Play } from 'lucide-react';

export const CustomerStoriesSection: React.FC = () => {
  const stories = [
    {
      id: 'story-1',
      name: 'Mr. Pavan',
      role: 'Civil Contractor, Ayodhya Dham',
      title: 'Mr. Pavan shares his NirmanSetu experience',
      caption: 'experience.',
      imageUrl: '/images/customers/pavan.png',
      bgColor: 'bg-[#1b2b34]',
    },
    {
      id: 'story-2',
      name: 'Mr. Vishal',
      role: 'Interior Designer & Builder, Faizabad',
      title: 'Hear what Mr. Vishal had to say',
      caption: 'experience',
      imageUrl: '/images/customers/vishal.png',
      bgColor: 'bg-[#f5b800]',
    },
    {
      id: 'story-3',
      name: 'Mr. Gopal',
      role: 'Site Supervisor, Ram Path Project',
      title: 'Hear what Mr. Gopal had to say',
      caption: 'As such,',
      imageUrl: '/images/customers/gopal.png',
      bgColor: 'bg-[#f0c325]',
    },
  ];

  return (
    <section className="py-10 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading matching screenshot 5 */}
        <div className="mb-8 text-left">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Customers love NirmanSetu
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Join thousands of our happy customers who have made the switch to NirmanSetu.
          </p>
        </div>

        {/* 3 Vertical Phone-Style Video Reel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {stories.map((story) => (
            <div key={story.id} className="flex flex-col items-center group cursor-pointer">
              
              {/* Vertical Video Reel Card (Aspect 9:16) */}
              <div className="relative w-full aspect-9/16 max-w-[280px] rounded-[28px] overflow-hidden shadow-lg border-2 border-slate-900/10 group-hover:shadow-2xl group-hover:-translate-y-1 transition-all duration-300 bg-slate-900">
                
                {/* Person Background Photo */}
                <img
                  src={story.imageUrl}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                {/* Top-Right Yellow Lightning Bolt Badge */}
                <div className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-[#f5b800] text-slate-950 flex items-center justify-center shadow-md">
                  <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                </div>

                {/* Play Button Overlay on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-6 h-6 fill-slate-950 ml-1" />
                  </div>
                </div>

                {/* Centered Caption Sticker Box (matching screenshot: black box with bold white text) */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div className="bg-black/90 text-white font-black text-sm sm:text-base px-4 py-1.5 rounded-lg shadow-lg tracking-tight">
                    {story.caption}
                  </div>
                </div>

                {/* Bottom Card Details */}
                <div className="absolute bottom-4 inset-x-4 text-white">
                  <div className="text-sm font-black leading-tight">{story.name}</div>
                  <div className="text-[11px] text-slate-300 font-medium">{story.role}</div>
                </div>

              </div>

              {/* Caption text below video card matching screenshot 5 */}
              <p className="mt-3 text-xs sm:text-sm font-bold text-slate-800 text-center leading-snug group-hover:text-amber-800 transition-colors max-w-[260px]">
                {story.title}
              </p>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
