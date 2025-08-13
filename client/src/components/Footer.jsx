import React from 'react';
import { Github } from 'lucide-react';

// A simple, clean footer component for the Klarity application.
export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 border-t border-gray-800 p-4 text-center text-xs text-gray-400">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-x-4 gap-y-2">
        <span>© 2025 Klarity. All rights reserved.</span>
        
        <span className="hidden sm:inline">|</span>
        
        <a 
          href="https://3-d-portfolio-beige-two.vercel.app/"
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-emerald-400 transition-colors"
        >
          Built by Ankan
        </a>
        
        <span className="hidden sm:inline">|</span>
        
        <a 
          href="https://github.com/CodeWithAnkan/klarity"
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
        >
          <Github className="w-3.5 h-3.5" />
          Source Code
        </a>
        
        <span className="hidden sm:inline">|</span>
        
        <span>v1.0.0</span>
      </div>
    </footer>
  );
}
