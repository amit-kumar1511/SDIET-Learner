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
