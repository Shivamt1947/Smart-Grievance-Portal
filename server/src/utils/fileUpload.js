import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if credentials are present
const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Local upload directory fallback
const uploadDir = path.resolve('public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `attachment-${uniqueSuffix}${ext}`);
  },
});

// File filter for safety
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, PDF, and TXT are allowed.'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 4, // Max 4 attachments
  },
  fileFilter,
});

/**
 * Uploads a local file to Cloudinary if configured, or returns local static path
 */
export const processUploadedFile = async (file) => {
  if (hasCloudinary) {
    try {
      const uploadRes = await cloudinary.uploader.upload(file.path, {
        folder: 'smart-grievance-portal',
        resource_type: 'auto',
      });
      // Delete temporary local file
      fs.unlink(file.path, () => {});
      return {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (err) {
      console.warn('[Cloudinary Warning] Cloudinary upload failed, using local file:', err.message);
    }
  }

  // Fallback to local server static URL
  return {
    url: `/uploads/${file.filename}`,
    publicId: file.filename,
    filename: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  };
};
