const {check} = require('express-validator')

exports.registerValidator = [
    check('name','Name is required').not().isEmpty(),
    check('email','Valid email is required').isEmail().normalizeEmail({
        gmail_remove_dots:true
    }),
    check('mobile','Mobile number should be 10 digites').isLength({
        min:10,
        max:10
    }),
    check('password','Password must be greater then 6 charector, and contains at least one uppercase , one number or one special charecter ')
    .isStrongPassword({
        minLength:6,
        minUppercase:1,
        minNumbers:1,
        minLowercase:1
    }),
    check('image').custom((value,{req})=>{
            if(req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/png'){
                    return true ;
            }
            else{
                return false;
            }
    }).withMessage("Please upload an image JPEG/PNG formate")
]

exports.sendMailVerificationValidator = [
    check('email','Valid email is required').isEmail().normalizeEmail({
        gmail_remove_dots:true
    })
]
exports.forgotPasswordValidator = [
    check('email','Valid email is required').isEmail().normalizeEmail({
        gmail_remove_dots:true
    })
]
exports.loginValidator = [
    check('email','Valid email is required').isEmail().normalizeEmail({
        gmail_remove_dots:true
    }),
    check('password','password is required').not().isEmpty()
]
exports.updateProfileValidator = [
    check('name','Name is required').not().isEmpty(),
    check('mobile','Mobile number should be 10 digites').isLength({
        min:10,
        max:10
    }),
]
exports.sendMailOtpValidator = [
    check('email','Valid email is required').isEmail().normalizeEmail({
        gmail_remove_dots:true
    })
]

exports.verifyOtpValidator = [
    check('user_id','User id is required').not().isEmpty(),
    check('otp','Otp is required').not().isEmpty()
]