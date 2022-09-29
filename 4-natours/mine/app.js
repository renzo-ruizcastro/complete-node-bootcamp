// Convention to use app.js for express configuration
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res
    .status(200) // 200 is the default status code
    // .send('Hello from the server side!'); // add header content-type: text/html
    .json({ message: 'Hello from the server side!', app: 'Natours' }); // add header content-type: application/json
});

app.post('/', (req, res) => {
  res.send('You can post to this endpoint...');
});

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
