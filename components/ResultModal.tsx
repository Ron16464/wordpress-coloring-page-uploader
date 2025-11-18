import React, { useCallback } from 'react';
import { ProcessedImage } from '../types';
import { Button } from './Controls';
import { DownloadIcon, CheckIcon, XIcon, ExternalLinkIcon } from './Icons';

// This is needed because JSZip is loaded from a CDN
declare const JSZip: any;

interface ResultModalProps {
  postUrl: string;
  editUrl: string;
  images: ProcessedImage[];
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ postUrl, editUrl, images, onClose }) => {

  const handleDownload = useCallback(async () => {
    const zip = new JSZip();
    images.forEach(image => {
      zip.file(image.name, image.blob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = 'coloring-pages.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [images]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload Successful!</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <XIcon className="h-6 w-6 text-slate-500" />
          </button>
        </header>

        <main className="p-6 flex-grow overflow-y-auto space-y-6">
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50">
                    <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mt-4 text-lg leading-6 font-medium text-slate-900 dark:text-white">Post Created Successfully</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Your post and images have been uploaded to WordPress.
                </p>
            </div>
            <div className="space-y-3">
                 <a href={postUrl} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                    View Post
                    <ExternalLinkIcon className="ml-2 h-4 w-4" />
                 </a>
                 <a href={editUrl} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center rounded-md bg-slate-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600">
                    Edit Post in WordPress
                    <ExternalLinkIcon className="ml-2 h-4 w-4" />
                 </a>
            </div>
             <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-300 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-slate-50 dark:bg-slate-900 px-2 text-sm text-slate-500">Optional</span>
                </div>
            </div>
            <Button onClick={handleDownload} className="w-full bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                <DownloadIcon className="mr-2 h-5 w-5" />
                Download Images ZIP
            </Button>
        </main>
      </div>
    </div>
  );
};
