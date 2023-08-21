import express from 'express';
const router = express.Router();

import { isLoggedIn } from '../middlewares/auth.middleware.js';

import { register, login, logout, gegtProfile } from "./../controllers/user.controller.js";


router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', isLoggedIn, gegtProfile);

export default router;