const express=require("express")
const app=express()
const dotenv=require('dotenv').config()
const handlebars=require("express-handlebars")
const cookieParser=require("cookie-parser")
const session=require("express-session")
const path=require("path")
const logger = require('morgan');
const hbs=require("hbs")
const nocache=require("nocache")
const userRouter=require("./routes/userRouter")
const adminRouter=require("./routes/adminRouter")
const db=require("./config/db")
db()

//configure handlebars
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', handlebars.engine({
  layoutsDir: __dirname + '/views/layouts',
  extname: 'hbs',
  defaultLayout: 'layout',
  partialsDir: __dirname + '/views/partials/'
}));


hbs.registerPartials(path.join(__dirname,'/views/partials'))


app.use(session({
    secret: process.env.SECRETKEY,
    resave: false ,
    saveUninitialized: true,
     cookie: { 
        secure:false,
        httpOnly:true,
        maxAge: 600000000
     }
  }));
  

app.use(nocache());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//define routes
app.use('/admin', adminRouter);
app.use('/', userRouter);

app.listen(process.env.PORT,()=>{
    console.log("server is running")
})