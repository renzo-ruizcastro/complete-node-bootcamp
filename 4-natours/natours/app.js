const express = require('express');
const morgan = require('morgan');

const app = express();

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

// global middlewares
if (process.env.NODE_ENV === 'development') app.use(morgan('combined'));

app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// routed middlewares
// mount routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
