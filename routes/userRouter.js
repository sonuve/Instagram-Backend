import express from 'express';
import isAuthenticated from '../Middlewares/isAuthenticated.js';
import {
    register,
    login,
    logout,
    getprofile,
    editprofile,
    getSuggestionUsers,
    followOrunfollow
} from '../controllers/userController.js';
import upload from '../Middlewares/multer.js';

const router = express.Router();

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);

// Protected Routes
router.get('/:id/profile', isAuthenticated, getprofile);
router.post('/profile/edit', isAuthenticated, upload.single('profilephoto'), editprofile);
router.get('/suggestion', isAuthenticated, getSuggestionUsers);
router.get('/followOrunfollow/:id', isAuthenticated, followOrunfollow);

export default router;
