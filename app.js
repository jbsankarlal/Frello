var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars')
var db=require('./config/connection')

var session=require('express-session')





var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
const { extname } = require('path');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout',partialsDir:__dirname+'/views/partials',
helpers:{
  isEqual:(status,value,options)=>{
if(status == value){
  return options.fn(this)
}
return options.inverse(this)
  }}
}))

app.use(session({secret:"AvengersAssemble",cookie:{maxAge:10000000}}))
db.connect((err)=>{
  if(err) console.log("Database error", err);
  else console.log("Database connected");
})


app.use('/', indexRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('user/error',{user:true});
});

module.exports = app;
