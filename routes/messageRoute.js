import express from 'express'
import { getMessages, sendMessage } from '../controllers/chatsController.js';
import isAuthenticated from '../Middlewares/isAuthenticated.js';
const router=express.Router();

router.post('/send/:id',isAuthenticated,sendMessage);
router.get('/all/:id',isAuthenticated,getMessages);

export default router;