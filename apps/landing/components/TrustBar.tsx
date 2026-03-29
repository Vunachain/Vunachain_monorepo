import React from 'react';
import Tooltip from './Tooltip';

const TrustBar: React.FC = () => {
  return (
    <div className="w-full border-y border-gray-200 dark:border-white/5 bg-white dark:bg-black/20">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-10 lg:flex-row lg:justify-center lg:gap-16">

        <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10">

          {/* Celo - Updated to be rings (donuts) for better accuracy */}
          <div className="group flex items-center gap-3 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-default hover:scale-105">
            <Tooltip content="Celo Blockchain">
              <div className="flex items-center gap-2">
                <svg className="h-9 w-9" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="11" r="7" className="stroke-[#FBCC5C]" strokeWidth="4" />
                  <circle cx="11" cy="27" r="7" className="stroke-[#5EA0EE]" strokeWidth="4" />
                  <circle cx="29" cy="27" r="7" className="stroke-[#35D07F]" strokeWidth="4" />
                </svg>
                <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">celo</span>
              </div>
            </Tooltip>
          </div>

          {/* KEPSA - Improved typography and spacing */}
          <div className="group flex items-center gap-4 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-default hover:scale-105">
            <Tooltip content="Kenya Private Sector Alliance">
              <div className="flex items-center gap-2">
                {/* Abstract representation of KEPSA logo icon if needed, or just strong text */}
                <div className="h-8 w-8 rounded bg-[#008751] flex items-center justify-center text-white font-black text-xs">KE</div>
                <div className="flex flex-col leading-none">
                  <span className="text-2xl font-black tracking-tighter text-[#008751]">KEPSA</span>
                  <span className="text-[0.6rem] font-bold uppercase tracking-wider text-gray-600 group-hover:text-[#006b40] transition-colors">Private Sector Alliance</span>
                </div>
              </div>
            </Tooltip>
          </div>

          {/* KAM - Added Gear Icon for accuracy */}
          <div className="group flex items-center gap-4 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-default hover:scale-105">
            <Tooltip content="Kenya Association of Manufacturers">
              <div className="flex items-center gap-2">
                {/* Gear Icon representing Manufacturing */}
                <div className="text-[#0060aa]">
                  <span className="material-symbols-outlined text-4xl">settings</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-2xl font-black tracking-tighter text-[#0060aa]">KAM</span>
                  <span className="text-[0.5rem] font-bold uppercase tracking-widest text-gray-600 group-hover:text-[#004d88] transition-colors">Kenya Association of Manufacturers</span>
                </div>
              </div>
            </Tooltip>
          </div>

          {/* EUDR Ready */}
          <div className="group flex items-center gap-2 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-default hover:scale-105">
            <Tooltip content="EUDR Compliant">
              <div className="flex items-center gap-2 text-[#61b869] border border-[#61b869] px-3 py-1 rounded-full bg-[#61b869]/5">
                <span className="material-symbols-outlined text-xl">verified_user</span>
                <span className="font-bold text-sm">EUDR Ready</span>
              </div>
            </Tooltip>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TrustBar;