'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const MilestoneStoryBanner: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <Link href="/about" className="block relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-emerald-200/80 bg-[#f4fbf5] group">
        <img
          src="/images/series_a_funding_banner.webp"
          alt="NirmanSetu ₹60 Cr Commitment to continue revolutionizing the way you buy construction materials - Read full story"
          className="w-full h-auto object-cover sm:object-contain block transition-transform duration-300 group-hover:scale-[1.005]"
          loading="lazy"
          decoding="async"
        />
      </Link>
    </section>
  );
};
