const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'], // [true, error_message]
  },
});

// Convention: Capitalize first letter of model name
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
