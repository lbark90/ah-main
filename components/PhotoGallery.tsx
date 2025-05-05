import React, { useState } from 'react';
import Image from 'next/image';

interface Props {
  photos?: string[];
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
}

export default function PhotoGallery({ photos = [], onUpload, isUploading = false }: Props) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div>
      <h2 className="text-3xl mb-8">Photo Gallery</h2>

      {/* Photo grid - moved above the upload button and made photos bigger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-700 cursor-pointer hover:border-blue-400 transition-colors shadow-lg"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
              <img
                src={photo}
                alt={`Gallery photo ${index + 1}`}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
                width={400}
                height={400}
              />
            </div>
          </div>
        ))}

        {/* Only show the upload placeholder when there are no photos */}
        {photos.length === 0 && !isUploading && (
          <div className="relative aspect-square rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center">
            <p className="text-slate-400 text-center px-4">No photos yet. Upload some using the button below.</p>
          </div>
        )}
      </div>

      {/* Upload button for gallery photos - moved below the photo grid */}
      <div className="mb-6">
        <label className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors text-white cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {isUploading ? (
            <>
              <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>Upload Photos</span>
              <span className="text-xs ml-1">(Select multiple)</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
            multiple
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative w-full max-w-6xl h-[85vh] p-4">
            <img
              src={selectedPhoto}
              alt="Selected photo"
              className="w-full h-full object-contain"
            />
            <button
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 rounded-full p-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
