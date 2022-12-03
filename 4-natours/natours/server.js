// good practice to separate server files from express app files
const app = require('./app');

// other stuff that server file might do:
// - database configuration
// - error handling
// - environment variables

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
