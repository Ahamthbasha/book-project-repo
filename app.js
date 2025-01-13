const express=require("express")
//express is used to create an express app
const app=express()
//we create an instance from the express

const dotenv=require('dotenv').config()
//load environmental variable into process.env file.It stores sensitive info

const handlebars=require("express-handlebars")
//used to render html in server side.It is used to render dynamic content

const cookieParser=require("cookie-parser")
//parse cookies attahed to the http request.It helps in reading cookies that are sent by clients to the server.

const session=require("express-session")
//it provides session management for your app.

const path=require("path")
//built in module provides utilities for working with file and directory paths.

const logger = require('morgan');
//it logss details of every incoming request

const hbs=require("hbs")
//it use handlbars as the templage engine in your express app.It registers helpers,partials and layouts for templates

const nocache=require("nocache")
//nocache is a middleware that prevents browser from caching the response.It ensures that every request from the client is treated as new one.

const multer=require("multer")
//it is used to upload files in a form.

const userRouter=require("./routes/userRouter")
const adminRouter=require("./routes/adminRouter")


const db=require("./config/db")
//db files contains the logic to connect the database

db()
//initialize the connection to the database

const moment=require("moment")
//it is a library for parsing,validating,manipulating and displaying dates and times in js.

require('./helpers/handlebarsHelper')
//it has defined a specific handlebars helpers

//configure handlebars
app.set('views', path.join(__dirname, 'views'));
//it tells where to look for the view files

app.set('view engine', 'hbs');
//it sets hadlebars as the engine to render those views

app.engine('hbs', handlebars.engine({
  layoutsDir: __dirname + '/views/layouts',
  extname: 'hbs',
  defaultLayout: 'layout',
  partialsDir: __dirname + '/views/partials/'
}));


hbs.registerPartials(path.join(__dirname,'/views/partials'))//reusable templates to be used in your handlebars views.


app.use(session({
    secret: process.env.SECRETKEY,
    resave: false ,
    saveUninitialized: true,
     cookie: { 
        secure:false,
        httpOnly:true,
        maxAge: 600000000//7days
     }
  }));
  

app.use(nocache());//prevents caching responses
app.use(logger('dev'));//log request

app.use(express.json());//parse JSON DATA from incoming request enable app to handle post or put request with a json body
app.use(express.urlencoded({ extended: true }));//parse url encoded bodies into js objects

app.use(cookieParser());//parse cookies sent by client in http request.Allow you to access cookies in your handlers.
app.use(express.static(path.join(__dirname, 'public')));
//this middleware serves static file from the public directory.so they can be accessed by the client (browser).

//define routes
app.use('/admin', adminRouter);
app.use('/', userRouter);

app.listen(process.env.PORT,()=>{
    console.log("server is running")
})