// middleware functions related to tours
const fs = require('fs');

const toursPath = `${__dirname}/../dev-data/data/tours-simple.json`;
const tours = JSON.parse(fs.readFileSync(toursPath, 'utf-8'));

// function to be exported to be used as param middleware function
exports.checkId = (req, res, next, val) => {
  console.log(`Tour id is: ${val}`);
  const id = +val;
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Resource not found',
    });
  }
  next();
}

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    })
  }
  next();
}

// middleware functions that send a response don't need to call next()
exports.getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
};

// requires param middleware to be executed first
exports.getTour = (req, res) => {
  // here the param id in the request is allowed
  // because of the param middleware's check
  // so we can dispose of some validation code
  const id = +req.params.id;
  const tour = tours.find((el) => el.id === id);
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);

  fs.writeFile(toursPath, JSON.stringify(tours), (err) => {
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  });
};

// requires param middleware to be executed first
exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    },
  });
};

// requires param middleware to be executed first
exports.deleteTour = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: null,
  });
};
