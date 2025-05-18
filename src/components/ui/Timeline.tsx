"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';

interface TimelineEntry {
  year: string;
  items: any[];
}

export const Timeline = ({ data, type }: { data: TimelineEntry[], type: 'movies' | 'tv' }) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  const handleItemClick = (itemId: number) => {
    navigate(type === 'movies' ? `/tmdb/movie/${itemId}` : `/tmdb/tv/${itemId}`);
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div ref={ref} className="relative">
        {data.map((yearGroup, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-20 md:gap-10">
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-black/60 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-red-500 border border-red-600 p-2" />
              </div>
              <h3 className="hidden md:block text-xl md:pl-20 md:text-4xl font-bold text-white/70">
                {yearGroup.year}
              </h3>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-white/70">
                {yearGroup.year}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {yearGroup.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className="group relative flex flex-col bg-black/40 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105"
                  >
                    <div className="aspect-[2/3] relative w-full">
                      <img
                        src={
                          item.poster_path
                            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                item.title || item.name
                              )}&background=444&color=fff&size=256`
                        }
                        alt={item.title || item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-center p-2">
                          <div className="text-[10px] font-semibold">
                            {item.title || item.name}
                          </div>
                          {item.character && (
                            <div className="text-[9px] italic mt-0.5">
                              {item.character}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <h3 className="text-[11px] font-medium line-clamp-1 text-white">
                        {item.title || item.name}
                      </h3>
                      {item.character && (
                        <div className="text-[9px] text-gray-300 mt-0.5 italic line-clamp-1">
                          {item.character}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-red-500/30 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-red-500 via-red-400 to-transparent from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
}; 