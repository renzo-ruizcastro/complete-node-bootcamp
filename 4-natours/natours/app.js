// Convention to use app.js for express configuration
const fs = require('fs');
const express = require('express');
const app = express();

// middleware
// app.use(middleware);
app.use(express.json()); // helps to get the body of the request

// app.get('/', (req, res) => {
//   res
//     .status(200) // 200 is the default status code
//     // .send('Hello from the server side!'); // add header content-type: text/html
//     .json({ message: 'Hello from the server side!', app: 'Natours' }); // add header content-type: application/json
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint...');
// });

const toursPath = `${__dirname}/dev-data/data/tours-simple.json`;

const tours = JSON.parse(fs.readFileSync(toursPath, 'utf-8'));

// Get all tours
// may require a req body
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    // jsend format
    status: 'success',
    results: tours.length,
    // a succesful put response should return the data specified in the request body
    data: {
      tours,
    },
  });
});

// Get a single tour
// optionar parameter (:y?): /api/v1/tours/:id/:x/:y?
app.get('/api/v1/tours/:id', (req, res) => {
  console.log(req.params); // { id: <value> }
  const id = +req.params.id; // or req.params.id * 1
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Resource not found',
    });
  }
  res.status(200).json({
    // jsend format
    status: 'success',
    data: {
      tour,
    },
  });
});

// Create a tour
// obviously requires a req body
app.post('/api/v1/tours', (req, res) => {
  // console.log(req.body);
  const newId = tours[tours.length - 1].id + 1; // a database would do this for us
  const newTour = Object.assign({ id: newId }, req.body); // this way you don't mutate the original body object
  tours.push(newTour);
  fs.writeFile(toursPath, JSON.stringify(tours), (err) => {
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  });
  // res.send('Done');
});

// Update (patch) a tour
// obviously requires a req body
app.patch('/api/v1/tours/:id', (req, res) => {
  const id = +req.params.id; // or req.params.id * 1
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Resource not found',
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    }
  });
});

// Update (patch) a tour
app.delete('/api/v1/tours/:id', (req, res) => {
  const id = +req.params.id; // or req.params.id * 1
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Resource not found',
    });
  }
  
  // a succesful delete usually sends back a 204 status code
  res.status(204).json({
    status: 'success',
    // a succesful delete response should return null, meaning that the data is deleted
    data: null,
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
