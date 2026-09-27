var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('hbs')
var session = require('express-session')
const mongoose = require('mongoose');
const dotenv = require('dotenv')

dotenv.config();

// connected to database
const connectDB = require('./config/database')
connectDB()


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();


// ال helper

hbs.registerHelper('ifEquals', function(value1, value2, options){
  if(value1 === value2){
    return options.fn(this)
  }

  return options.inverse(this)
})

hbs.registerHelper('eq', function(value1, value2) {

    return String(value1) === String(value2);

});

hbs.registerHelper('add', function(value1 , value2){

  return Number(value1) + Number(value2)

})

hbs.registerHelper('arabicNumber', function(number) {

    const numbers = [
        '',
        'الأول',
        'الثاني',
        'الثالث',
        'الرابع',
        'الخامس',
        'السادس',
        'السابع',
        'الثامن',
        'التاسع',
        'العاشر',
        'الحادي عشر',
        'الثاني عشر',
        'الثالث عشر',
        'الرابع عشر',
        'الخامس عشر',
        'السادس عشر',
        'السابع عشر',
        'الثامن عشر',
        'التاسع عشر',
        'العشرون'
    ];

    const num = Number(number);

    if (!Number.isInteger(num) || num < 1) {
        return '';
    }

    return numbers[num] || num;
});

hbs.registerHelper('ifGreaterThan', function (value, compare, options) {

    if (Number(value) > Number(compare)) {
        return options.fn(this);
    }

    return options.inverse(this);
});



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json({limit : '5mb'}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret : process.env.SESSION_SECRET,
  resave : false,
  saveUninitialized : false
}))

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

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
  res.render('error');
});

module.exports = app;
