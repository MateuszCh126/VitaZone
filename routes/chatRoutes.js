import express from 'express';
import { handleChat } from '../server/controllers/chatController.js';

const router = express.Router();

router.post('/', handleChat);

export default router;
