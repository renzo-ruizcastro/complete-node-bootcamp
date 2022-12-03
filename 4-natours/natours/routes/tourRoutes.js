const express = require('express');
const tourController = require('./../controllers/tourController');

const router = express.Router();

// remember that the order of the middlewares matters

// param middleware
// parameter 1: name of the parameter
// parameter 2: callback function, 4th parameter is the value of the parameter
router.param('id', (tourController.checkId));

// Create a checkBody middleware
// Check if body contains the name and price property
// If not, send back 400 (bad request)



router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.checkBody, tourController.createTour); // chained middlewares, order matters

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
