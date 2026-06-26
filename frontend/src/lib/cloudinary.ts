import toast from 'react-hot-toast';

export const getCloudinaryUrl = (url: string) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;

  // Ensure it uses https
  let secureUrl = url.replace('http://', 'https://');

  // Fix legacy PDF handling: if it's a PDF but marked as image, force it to raw
  if (secureUrl.toLowerCase().endsWith('.pdf') && secureUrl.includes('/image/upload/')) {
    secureUrl = secureUrl.replace('/image/upload/', '/raw/upload/');
  }

  // Ensure raw files are accessed via /raw/upload/ if they are in the pdfs folder
  if (secureUrl.includes('/pdfs/') && !secureUrl.includes('/raw/upload/')) {
    secureUrl = secureUrl.replace('/image/upload/', '/raw/upload/');
  }

  return secureUrl;
};

export const getDownloadUrl = (url: string) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;

  const secureUrl = getCloudinaryUrl(url);
  
  // If it's a raw resource (PDF using our new config), fl_attachment doesn't apply
  if (secureUrl.includes('/raw/upload/')) {
    return secureUrl;
  }

  const parts = secureUrl.split('/upload/');
  if (parts.length === 2) {
    // Add fl_attachment flag to force download for image resources
    return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
  }
  return secureUrl;
};

export const getViewerUrl = (url: string) => {
  if (!url) return '';
  const secureUrl = getCloudinaryUrl(url);
  
  // For raw resources, browsers will try to render them if they can (PDFs)
  return secureUrl;
};

export const downloadFile = async (url: string, filename: string) => {
  if (!url) return;
  const secureUrl = getCloudinaryUrl(url);
  const toastId = toast.loading('Preparing download...');
  try {
    const response = await fetch(secureUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    let finalFilename = filename;
    const urlExt = secureUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
    const fileExt = urlExt && ['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(urlExt) ? urlExt : 'pdf';
    
    if (!finalFilename.toLowerCase().endsWith(`.${fileExt}`)) {
      finalFilename = `${finalFilename}.${fileExt}`;
    }

    finalFilename = finalFilename.replace(/[^a-zA-Z0-9\s\-\_\.]/g, '_');

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    
    toast.success('Download completed!', { id: toastId });
  } catch (error) {
    console.error('Blob download failed, opening in new tab instead:', error);
    toast.error('Opening file in new tab...', { id: toastId });
    window.open(secureUrl, '_blank');
  }
};
