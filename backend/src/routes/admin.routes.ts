import { Router } from 'express';
import multer from 'multer';
import { AdminUploadController } from '../controllers/adminUpload.controller';
import { AdminContactController } from '../controllers/adminContact.controller';
import { AdminDbHealthController } from '../controllers/adminDbHealth.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { AppError } from '../middleware/error';

const router = Router();
const adminUploadController = new AdminUploadController();
const adminContactController = new AdminContactController();
const adminDbHealthController = new AdminDbHealthController();

// Database Operations & Health Dashboard Endpoint (Admin Only)
router.get(
  '/database/health',
  authMiddleware,
  roleMiddleware('admin'),
  (req, res, next) => adminDbHealthController.getDatabaseHealth(req, res, next)
);

// Multer in-memory storage for handling image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file format. Only JPG, JPEG, PNG, and WEBP images are allowed.', 400));
    }
  },
});

// Admin Protected Upload Endpoint
router.post(
  '/upload-image',
  authMiddleware,
  roleMiddleware('admin'),
  upload.single('image'),
  (req, res, next) => adminUploadController.uploadImage(req, res, next)
);

// Admin Protected Delete Endpoint
router.delete(
  '/delete-image',
  authMiddleware,
  roleMiddleware('admin'),
  (req, res, next) => adminUploadController.deleteImage(req, res, next)
);

router.post(
  '/delete-image',
  authMiddleware,
  roleMiddleware('admin'),
  (req, res, next) => adminUploadController.deleteImage(req, res, next)
);

// --- Contact Messages Admin Endpoints ---
router.get(
  '/contact-messages',
  authMiddleware,
  roleMiddleware('admin'),
  (req, res, next) => adminContactController.getMessages(req, res, next)
);

router.get(
  '/contact-messages/unread-count',
  authMiddleware,
  roleMiddleware('admin'),
  (req, res, next) => adminContactController.getUnreadCount(req, res, next)
);

router.get(
  '/contact-messages/export-csv',
  authMiddleware,
  roleMiddleware('admin'),
  (req, res, next) => adminContactController.exportCsv(req, res, next)
);

router.patch(
  '/contact-messages/:id/status',
  authMiddleware,
  roleMiddleware('admin'),
  (req, res, next) => adminContactController.updateStatus(req, res, next)
);

router.delete(
  '/contact-messages/:id',
  authMiddleware,
  roleMiddleware('admin'),
  (req, res, next) => adminContactController.deleteMessage(req, res, next)
);

export default router;

