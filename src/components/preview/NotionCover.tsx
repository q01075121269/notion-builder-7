import React from 'react';
import { useApp } from '../../context/AppContext';
import { Image, Shuffle } from 'lucide-react';

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1507842229451-7f01be8860ee?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80'
];

export const NotionCover: React.FC<{ coverUrl?: string }> = ({ coverUrl }) => {
  const { updateCurrentCover } = useApp();

  const handleRandomCover = () => {
    const randomIndex = Math.floor(Math.random() * COVER_PRESETS.length);
    updateCurrentCover(COVER_PRESETS[randomIndex]);
  };

  const currentCover = coverUrl || COVER_PRESETS[0];

  return (
    <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden group bg-neutral-100 dark:bg-neutral-800">
      <img
        src={currentCover}
        alt="Notion Cover"
        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
      />

      {/* Hover Action: Change Cover */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleRandomCover}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-black/60 hover:bg-black/80 text-white rounded-md backdrop-blur transition shadow-md"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>커버 변경</span>
        </button>
      </div>

      <div className="absolute bottom-2 right-4 text-[10px] text-white/70 bg-black/30 px-2 py-0.5 rounded backdrop-blur pointer-events-none">
        <Image className="w-2.5 h-2.5 inline mr-1" />
        Unsplash 커버
      </div>
    </div>
  );
};
