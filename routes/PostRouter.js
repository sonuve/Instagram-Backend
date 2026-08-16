import express from 'express'
import isAuthenticated from '../Middlewares/isAuthenticated.js';
import upload from '../Middlewares/multer.js';
import { addComment, bookMark, deletePost, disLikePost, getAllCommentOfPost, getAllPost, getUserPost, LikePost, userpost } from '../controllers/userpost.js';

const router=express.Router();

router.post('/addNewPost',isAuthenticated,upload.single('image'),userpost);
router.get('/all',isAuthenticated,getAllPost);
router.get('/userPost/all',isAuthenticated,getUserPost);
router.get('/:id/like',isAuthenticated,LikePost);
router.get('/:id/disLike',isAuthenticated,disLikePost);
router.post('/:id/comment',isAuthenticated,addComment);
router.post('/:id/comment/all',isAuthenticated,getAllCommentOfPost);
router.delete('/delete/:id',isAuthenticated,deletePost);
router.post('/:id/bookMark',isAuthenticated,bookMark);
export default router;