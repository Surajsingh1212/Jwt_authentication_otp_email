const jwt= require('jsonwebtoken')
require('dotenv').config()
const BlackListToken = require('../models/blackListToken')

const verifyToken = async(req,res,next)=>{
    const token =  req.body.token || req.query.token || req.headers["authorization"];
    if(!token){
        return res.status(403).json({
            success:false,
            msg:"A token is required for authentication "
        })
    }
    try{
        const bearer = token.split(' ');
        const bearerToken = bearer[1]
        // here check if token available on blacklisttoken model
        const blackListedToken =  await BlackListToken.findOne({token:bearerToken})
        if(blackListedToken){
            return res.status(400).json({
                success:false,
                msg:"This session hase been expired please try again"
            })
        }

        const decodedData =  jwt.verify(bearerToken,process.env.ACCESS_TOKEN_SECRET_KEY)
        req.user = decodedData;
    }
    catch(error){
        return res.status(401).json({
            success:false,
            msg:"Invalid token"
        })
    }
    return next();
}

module.exports = verifyToken;