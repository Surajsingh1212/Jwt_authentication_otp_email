const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const { validationResult } = require('express-validator')
const mailer = require('../helpers/mailer')
const ForgotPassword = require('../models/forgotPassword')
const randomstring = require('randomstring')
const jwt = require('jsonwebtoken')
const path = require('path')
const { deleteFile } = require('../helpers/deleteFile')
const BlackListToken = require('../models/blackListToken')
const mailOtp = require('../models/mailOtp')
const { oneMinuteExpiry,threeMinuteExpiry } = require('../helpers/otpValidate')

const userRegister = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                msg: "Errors",
                errors: errors.array()
            })
        }
        const { name, email, mobile, password } = req.body;
        const isExists = await User.findOne({ email })
        if (isExists) {
            return res.status(400).json({
                success: false,
                msg: "User Already Registered"
            })
        }
        const hashPassword = await bcrypt.hash(password, 10)
        const user = new User({
            name,
            email,
            password: hashPassword, // Corrected spelling
            mobile,
            image: 'images/' + req.file.filename
        })
        const userData = await user.save()
        // send mail to user
        const msg = '<p>Hi ' + name + ',Please <a href="http://127.0.0.1:3000/mail-verification?id=' + userData._id + '">Verify</a> your mail</p>'
        mailer.sendMail(email, 'Mail Verification', msg)
        return res.status(200).json({
            success: true,
            msg: 'Register Successfully',
            user: userData
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        })
    }
}

// verify mail api 
const mailVerification = async (req, res) => {
    try {
        if (req.query.id == undefined) {
            return res.render('404');
        }
        const userData = await User.findOne({ _id: req.query.id }) // Added await
        if (userData) {
            if (userData.is_verified == 1) {
                return res.render('mail-verification', { message: 'Your mail already verified .' })
            }

            await User.findByIdAndUpdate({ _id: req.query.id }, {
                $set: {
                    is_verified: 1
                }
            })
            return res.render('mail-verification', { message: 'Mail Verified Successfully .' })
        } else {
            return res.render('mail-verification', { message: 'User Not Found!' })
        }
    } catch (error) {
        console.log(error.message);
        return res.render('404');
    }
}

// send verification mail controller
const sendMailVerification = async (req, res) => {
    try {

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                msg: 'Errors',
                errors: errors.array()
            })
        }

        const { email } = req.body;
        const userData = await User.findOne({ email })
        if (!userData) {
            return res.status(400).json({
                success: false,
                msg: 'Email does not exist'
            })
        }
        if (userData.is_verified == 1) {
            return res.status(400).json({
                success: false,
                msg: userData.email + " " + 'Email already verified '
            })
        }
        const msg = '<p>Hi ' + userData.name + ',Please <a href="http://127.0.0.1:3000/mail-verification?id=' + userData._id + '">Verify</a> your mail</p>'
        mailer.sendMail(userData.email, 'Mail Verification', msg)
        return res.status(200).json({
            success: true,
            msg: 'Verification mail send successfully on your mail',
        })

    } catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        })
    }
}

// forgot password api 

const forgotPassword = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                msg: 'Errors',
                errors: errors.array()
            })
        }
        const { email } = req.body;
        const userData = await User.findOne({ email })
        if (!userData) {
            return res.status(400).json({
                success: false,
                msg: 'Email does not exist'
            })
        }
        const randomString = randomstring.generate();
        const msg = '<p>Hi ' + userData.name + ',Please click <a href="http://127.0.0.1:3000/reset-password?token=' + randomString + '">here</a> to Reset you password . </p>'
        await ForgotPassword.deleteMany({ user_id: userData._id })
        const resetPassword = new ForgotPassword({
            user_id: userData._id,
            token: randomString
        })
        await resetPassword.save();
        mailer.sendMail(userData.email, "Reset password", msg);
        return res.status(201).json({
            success: true,
            msg: 'Reset Passowrd Link send to your mail ,please check !'
        })
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        })
    }

}
const resetPassword = async (req, res) => {
    try {
        if (req.query.token == undefined) {
            return res.render('404')
        }
        const resetData = await ForgotPassword.findOne({ token: req.query.token })
        if (!resetData) {
            return res.render('404')
        }
        return res.render('reset-password', { resetData })
    }
    catch (error) {

        return res.render('404')
    }
}

const updatePassword = async (req, res) => {
    try {
        const { user_id, password, Cpassword } = req.body;

        const resetData = await ForgotPassword.findOne({ user_id })

        if (password != Cpassword) {
            return res.render('reset-password', { resetData, error: 'Confirm Password Not Matched !' })
        }
        const hashedPassword = await bcrypt.hash(Cpassword, 10)
        await User.findByIdAndUpdate({ _id: user_id }, {
            $set: {
                password: hashedPassword
            }
        })
        await ForgotPassword.deleteOne({ user_id })
        return res.redirect('/reset-success')
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        })
    }
}

const resetSuccess = async (req, res) => {
    try {
        return res.render('reset-success')
    }
    catch (error) {
        return res.render('404')
    }
}

// generate access token 
const generateAccessToken = async (user) => {
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: '1h' });
    return token
}
// user login 
const Login = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                msg: 'Errors',
                errors: errors.array()
            })
        }
        const { email, password } = req.body;
        const userData = await User.findOne({ email })
        if (!userData) {
            return res.status(401).json({
                success: false,
                msg: 'Email or password is incorrect '
            })
        }
        const passwordMatch = await bcrypt.compare(password, userData.password)
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                msg: 'Email or password is incorrect '
            })
        }
        if (userData.is_verified == 0) {
            return res.status(401).json({
                success: false,
                msg: 'Please verify your account '
            })
        }
        const accessToken = await generateAccessToken({ user: userData })

        return res.status(200).json({
            success: true,
            msg: 'User login successfully ',
            userData: userData,
            accessToken: accessToken,
            tokenType: 'Bearer'
        })
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        })
    }
}

// get user profile 
const UserProfile = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            msg: 'User Profile Data',
            data: req.user.user
        })
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        })
    }
}
// update user profile 
const UpdateProfile = async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                msg: 'Errors',
                errors: errors.array()
            })
        }
        const { name, mobile } = req.body;
        const data = {
            name, mobile
        }
        const user_id = req.user.user._id;

        if (req.file !== undefined) {
            data.image = 'images/' + req.file.filename
            const oldUser = await User.findOne({ _id: user_id })
            const oldFilePath = path.join(__dirname, '../public/' + oldUser.image)
            deleteFile(oldFilePath)
        }
        const userData = await User.findByIdAndUpdate({ _id: user_id }, {
            $set: data
        }, { new: true })
        return res.status(200).json({
            success: true,
            msg: 'User Profile Updated Successfully',
            Update_Data: userData
        })
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        })
    }
}
// logout user api 

const Logout = async (req, res) => {
    try {

        const token = req.body.token || req.query.token || req.headers["authorization"];
        const bearer = token.split(' ');
        const bearerToken = bearer[1];
        const newBlackListToken = new BlackListToken({
            token: bearerToken
        })
        await newBlackListToken.save()
        // clear cookie 
        res.setHeader('Clear-Site-Data', '"cookies","storage"');
        return res.status(200).json({
            success: true,
            msg: "User logout successfully"
        })
    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        })
    }
}


// generate Otp
const generateMailOtp = async() =>{
        return Math.floor(1000+Math.random() * 9000)
}
// send mail otp controller

const sendMailOtp = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                msg: "Errors",
                errors: errors.array()
            })
        }
        const { email } = req.body;
        const userData = await User.findOne({ email })
        if(!userData){
            return res.status(401).json({
                success: false,
                msg: "User Not registered !"
            }) 
        }
        if(userData.is_verified == 1){
            return res.status(401).json({
                success: false,
                msg: userData.email+" mail is already verified !"
            }) 
        }
        // generate otp
        const g_otp = await generateMailOtp()
        // check expery of otp 
        const oldOtpData = await mailOtp.findOne({ user_id : userData._id })
        if(oldOtpData){
            const sendNextOtp = await oneMinuteExpiry(oldOtpData.timestamp)
            if(!sendNextOtp){
                return res.status(401).json({
                    success: false,
                    msg:"Please try after some times !"
                }) 
            }
        }
        // otp save or update on model
        const cDate = new Date();
        await mailOtp.findOneAndUpdate(
            { user_id : userData._id},
            {otp:g_otp,timestamp:new Date(cDate.getTime())},
            {upsert:true,new:true,setDefaultsOnInsert:true}
        )

        // send mail 
        const msg = '<p>Hi <b>' + userData.name + '</b>,</br> <h4>'+ g_otp +'<h4></p>'
        mailer.sendMail(userData.email, 'Otp Verification', msg)
        return res.status(200).json({
            success: true,
            msg: 'Otp has been sent your mail , please check !',
        })

    }
    catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message
        })
    }
}

const verifyMailOtp=async( req,res)=>{
            try{
                const errors = validationResult(req)
                if(!errors.isEmpty()){
                    return res.status(400).json({
                        success: false,
                        msg: "Errors",
                        errors:errors.array()
                    })
                }
                const {user_id,otp} = req.body;
                const otpData = await mailOtp.findOne({
                    user_id,otp
                })
                if(!otpData){
                    return res.status(400).json({
                        success: false,
                        msg: 'Your entered otp is invailid !'
                    })
                }
                const isOtpExpired =  await threeMinuteExpiry(otpData.timestamp)
                if(isOtpExpired){
                    return res.status(400).json({
                        success: false,
                        msg: 'Your OTP has been expired !'
                    })
                }
                await User.findOneAndUpdate({_id:user_id},{
                    $set:{
                        is_verified:1
                    }
                })
                return res.status(200).json({
                    success: true,
                    msg: 'Account verified successfully !'
                })
            }
            catch(error){
                return res.status(400).json({
                    success: false,
                    msg: error.message
                })
            }
}
module.exports = {
    userRegister,
    mailVerification,
    sendMailVerification,
    forgotPassword,
    resetPassword,
    updatePassword,
    resetSuccess,
    Login,
    UserProfile,
    UpdateProfile,
    Logout,
    sendMailOtp,
    verifyMailOtp
};
