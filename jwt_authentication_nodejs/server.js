const express=  require('express')
const app = express()
const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/jwt-login-api')
require('dotenv').config()
const Port =  3000

// define view template engin 
app.set('view engine','ejs') 
app.set('views','./views') 

// userRoutes 
const userRoutes = require('./routes/userRoutes')
app.use('/api',userRoutes)

// authentications Routes 
const authRoutes = require('./routes/authRoute')
app.use('/',authRoutes)

app.listen(Port,()=>{
        console.log(`server running on port ${Port}`)
})