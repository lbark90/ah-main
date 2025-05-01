
import { useState } from 'react';
import Image from 'next/image';

interface Props {
  photos?: string[];
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PhotoGallery({ photos = [], onUpload }: Props) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div>
      <h2 className="text-3xl mb-8">Photo Gallery</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div 
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-700 cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => setSelectedPhoto(photo)}
          >
            <Image
              src={photo}
              alt={`Gallery photo ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
        
        {/* Upload placeholder */}
        <label className="relative aspect-square rounded-lg border-2 border-dashed border-slate-600 cursor-pointer hover:border-blue-400 transition-colors flex flex-col items-center justify-center">
          <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-slate-400">Upload Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative w-full max-w-4xl h-[80vh]">
            <Image
              src={selectedPhoto}
              alt="Selected photo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
