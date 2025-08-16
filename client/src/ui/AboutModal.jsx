import React from 'react';
import { X, Github } from 'lucide-react';

export default function AboutModal({ onClose }) {
  return (
    // Backdrop
    <div 
      onClick={onClose} 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      {/* Modal Card */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">About Klarity & Contributions</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-gray-300 text-sm prose prose-invert prose-sm">
          <p>
            Klarity is a powerful tool, but like any real-world application, it's built with specific trade-offs to ensure stability and reliability, especially in a free-to-use deployed environment.
          </p>
          
          <h3 className="text-emerald-400">The YouTube Transcription Challenge</h3>
          <p>
            The biggest technical hurdle for this project is YouTube's aggressive anti-bot detection. When an automated service (like our server on Railway) tries to download a video's audio for transcription, YouTube often blocks the request. This is an industry-wide problem that is incredibly difficult to solve reliably.
          </p>
          <ul>
            <li>
              <strong>Our Solution:</strong> Unfortunatly we do not have a solution for this problem. We are working on it. Your help is appreciated.
            </li>
            <li>
              <strong>The Trade-off:</strong> We cannot currently process videos that do not have a transcript, as the download would be blocked. The app will gracefully fail and inform you if a transcript is unavailable.
            </li>
          </ul>

          <h3 className="text-emerald-400">How You Can Contribute</h3>
          <p>
            This project is open-source, and contributions are welcome! If you have ideas on how to solve these challenges or want to add new features, I'd love to collaborate.
          </p>
          <p>
            Some ideas for future improvements include:
          </p>
          <ul>
            <li>Implementing a more robust, proxy-based solution for YouTube downloads.</li>
            <li>Adding support for other content platforms like Vimeo or news sites.</li>
            <li>Improving the UI/UX for managing content and spaces.</li>
          </ul>

          <a 
            href="https://github.com/CodeWithAnkan/klarity" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg px-4 py-2 mt-4 no-underline"
          >
            <Github className="w-4 h-4" />
            Contribute on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
