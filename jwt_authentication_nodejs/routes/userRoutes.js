const express = require('express');
const router = express.Router(); // Use express.Router() instead of express()
const path = require('path');
const multer = require('multer');

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, path.join(__dirname, '../public/images'));
        } else {
            cb(new Error('Invalid file type'), null);
        }
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '_' + file.originalname;
        cb(null, name);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// Body parsers
router.use(express.json());

// Importing user controller and validation
const userController = require('../controllers/userController');
const { registerValidator ,sendMailVerificationValidator,forgotPasswordValidator,loginValidator,updateProfileValidator,sendMailOtpValidator,verifyOtpValidator} = require('../helpers/validation');
const auth =  require('../middlewares/auth')

// Route definition
router.post('/register', upload.single('image'), registerValidator, userController.userRegister);
router.post('/send-mail-verification',sendMailVerificationValidator,userController.sendMailVerification)
router.post('/forgot-password',forgotPasswordValidator,userController.forgotPassword)
router.post('/login',loginValidator ,userController.Login)
router.get('/profile',auth,userController.UserProfile)
router.post('/update-profile',auth,upload.single('image'),updateProfileValidator,userController.UpdateProfile)
router.get('/logout',auth,userController.Logout)

// mail otp verification routes
router.post('/send-otp',sendMailOtpValidator,userController.sendMailOtp)
router.post('/verify-otp',verifyOtpValidator,userController.verifyMailOtp)
module.exports = router;
