const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  features: [String]
});

module.exports = mongoose.model('Service', serviceSchema);
