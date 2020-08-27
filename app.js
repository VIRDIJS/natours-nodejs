// ******/Require Declarations/*******
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const compression = require('compression');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// ******/Variable to hold express application/*******
const app = express();

// ******/SET UP VIEW ENGINE/*******
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ******/Middlewares/*******
// -----/Serving static files/-----
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(`${__dirname}/public`));

// -----/Set security HTTP Headers/-----
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'http://127.0.0.1:3000/*'],
      baseUri: ["'self'"],
      // fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: ["'self'", 'https://js.stripe.com/v3/','https://cdnjs.cloudflare.com/ajax/libs/axios/0.20.0/axios.min.js','https://*.cloudflare.com'],
      // objectSrc: ["'none'"],
      // styleSrc: ["'self'", 'https:', 'unsafe-inline'],
      upgradeInsecureRequests: [],
    },
  })
);

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in an hour.',
});
app.use('/api', limiter);

// Body parser; reading data from body into req.body
app.use(express.json({ limit: '10Kb' }));
app.use(express.urlencoded({extended:true, limit: '10Kb'}))
app.use(cookieParser());

// Data sanitization against NoSQL query injection attacks
app.use(mongoSanitize());

// Data sanitization against Cross-Site Scripting (XSS) attacks
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// app.use((req,res,next)=>{
//   console.log('Hello from the Middleware!');
//   next();
// })

app.use(compression())

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  // console.log(req.headers)
  next();
});

// ******/Mounting the Routers/*******

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);


// ******/Fallback Unhandled Endpoints/*******

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ******/ERROR HANDLING MIDDLEWARE/*******

app.use(globalErrorHandler);

module.exports = app;
