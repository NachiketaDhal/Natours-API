const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
// const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotpassword', authController.forgotPassword);
router.patch('/resetpassword/:token', authController.resetPassword);

router.use(authController.protect); // All the routes(middlewares) after this middleware are protected

router.patch('/updatepassword', authController.updatePassword);
router.patch(
  '/updateme',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteme', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser);

router.use(authController.restrictTO('admin')); // Only admin can access the routes below this middleware

router.get(
  '/inactiveusers',
  authController.restrictTO('admin'),
  authController.inactiveUsers
);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
