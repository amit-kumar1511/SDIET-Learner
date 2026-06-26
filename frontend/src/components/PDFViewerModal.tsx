import React, { useState } from 'react';
import { X, ExternalLink, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { downloadFile, getViewerUrl } from '../lib/cloudinary';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ url, title, onClose }) => {
  const viewerUrl = getViewerUrl(url);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  // It's an image if it has an image extension OR if it's explicitly served from /image/upload/
  const isImage = /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(viewerUrl) || viewerUrl.includes('/image/upload/');

  React.useEffect(() => {
    if (!isImage && viewerUrl) {
      setLoading(true);
      fetch(viewerUrl)
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.blob();
        })
        .then(blob => {
          // Sometimes Cloudinary raw uploads do not have correct content type. 
          // Manually cast the blob type to application/pdf for react-pdf.
          setPdfBlob(new Blob([blob], { type: 'application/pdf' }));
        })
        .catch(err => {
          console.error('PDF Fetch Error:', err);
          setError('Failed to load PDF. Trying fallback viewer...');
          setLoading(false);
        });
    }
  }, [viewerUrl, isImage]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error('PDF Load Error:', err);
    setError('Failed to load PDF. Trying fallback viewer...');
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-4">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => downloadFile(url, title)}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <a
              href={viewerUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-auto flex flex-col items-center p-4">
          {isImage ? (
            <div className="flex-1 flex items-center justify-center w-full">
              <img 
                src={viewerUrl} 
                alt={title} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError('Failed to load image');
                  setLoading(false);
                }}
              />
            </div>
          ) : (
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-50/50 dark:bg-gray-900/50 transition-opacity">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading Document...</p>
                  </div>
                </div>
              )}

              {error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 w-full">
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md">
                    <p className="text-red-600 dark:text-red-400 mb-6 font-medium">
                      {error}
                    </p>
                    <iframe
                      src={`${viewerUrl}#toolbar=1`}
                      className="w-full h-[300px] border dark:border-gray-700 rounded mb-6"
                      title="Fallback Viewer"
                    />
                    <a
                      href={viewerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-shadow shadow-md font-medium"
                    >
                      View Original File <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : pdfBlob ? (
                <Document
                  file={pdfBlob}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  className="flex flex-col items-center space-y-4"
                  loading={null}
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <div key={`page_${index + 1}`} className="shadow-xl rounded-sm overflow-hidden">
                      <Page
                        pageNumber={index + 1}
                        renderAnnotationLayer={false}
                        renderTextLayer={true}
                        width={Math.min(window.innerWidth - 64, 800)}
                        loading={<div className="h-[800px] w-full bg-white animate-pulse" />}
                      />
                    </div>
                  ))}
                </Document>
              ) : null}
            </>
          )}
        </div>

        {/* Footer Info */}
        {!isImage && numPages && (
          <div className="p-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center text-sm text-gray-500 dark:text-gray-400">
            Total Pages: {numPages}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewerModal;
