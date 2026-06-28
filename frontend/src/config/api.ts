const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return 'http://localhost:3001';
  }
  
  if (envUrl.includes(',')) {
    const urls = envUrl.split(',').map((url: string) => url.trim());
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isLocal) {
      const localUrl = urls.find((url: string) => url.includes('localhost') || url.includes('127.0.0.1'));
      if (localUrl) return localUrl;
    } else {
      const prodUrl = urls.find((url: string) => !url.includes('localhost') && !url.includes('127.0.0.1'));
      if (prodUrl) return prodUrl;
    }
    return urls[0];
  }
  
  return envUrl;
};

export const API_BASE_URL = getApiBaseUrl();
