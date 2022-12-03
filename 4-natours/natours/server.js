// good practice to separate server files from express app files

// terminal: npm install dotenv
const dotenv = require('dotenv');
// reading of environment variables only happens once
dotenv.config({ path: './config.env' });

// only after reading th enviroment variables we can use them in the app
const app = require('./app');

// other stuff that server file might do:
// - database configuration
// - error handling
// - environment variables
// console.log(app.get('env')); // => 'development' by default for express
// console.log(process.env);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
