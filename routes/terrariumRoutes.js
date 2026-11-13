import express from 'express';
import { verifyToken } from '../server/middleware/authMiddleware.js';
import {
    acceptMyProjectQuote,
    createProject,
    getCatalog,
    getMyProject,
    getMyProjects
} from '../server/controllers/terrariumController.js';

const router = express.Router();

router.get('/catalog', getCatalog);
router.post('/projects', verifyToken, createProject);
router.get('/projects', verifyToken, getMyProjects);
router.get('/projects/:projectId', verifyToken, getMyProject);
router.post('/projects/:projectId/accept', verifyToken, acceptMyProjectQuote);

export default router;
