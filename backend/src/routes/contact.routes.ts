import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';

import { contactLimiter } from '../middleware/rateLimiter';

const router = Router();
const contactController = new ContactController();

// Public route to submit contact form with rate limit
router.post('/', contactLimiter, (req, res, next) => contactController.submitContact(req, res, next));

export default router;
