import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const getConfigValue = (keys: string[], defaultValue: string) => {
  for (const key of keys) {
    const val = process.env[key];
    if (val && val.trim() !== '') {
      return val.trim();
    }
  }
  return defaultValue;
};

cloudinary.config({
  cloud_name: getConfigValue(['CLOUDINARY_CLOUD_NAME', 'Cloudnary_name'], 'sdietian').toLowerCase(),
  api_key: getConfigValue(['CLOUDINARY_API_KEY', 'Cloudnary_id'], '221615238522949'),
  api_secret: getConfigValue(['CLOUDINARY_API_SECRET', 'Cloudnary_secret'], 'lGWVPLHnmC5yMk-pVvwLcILHiw8'),
  secure: true,
});

console.log('Cloudinary initialized with cloud_name:', getConfigValue(['CLOUDINARY_CLOUD_NAME', 'Cloudnary_name'], 'sdietian').toLowerCase());

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    const isPDF = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const folder = isPDF ? 'sdiet-learner-portal/pdfs' : 'sdiet-learner-portal/images';
    const resource_type = isPDF ? 'raw' : 'auto';
    
    // For PDFs, we should include the extension in the public_id for better browser compatibility when raw
    const baseName = file.originalname.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const publicId = `${baseName}_${Date.now()}${isPDF ? '.pdf' : ''}`;

    return {
      folder,
      resource_type: resource_type,
      public_id: publicId,
    };
  },
} as any);

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export default cloudinary;
