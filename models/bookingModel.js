// *****/MODULE IMPORTS AND REQUIRE DECLARATIONS/*****

const mongoose = require('mongoose');

// *****/SCHEMA DEFINITION/*****

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Required Field: Please provide a tour Id'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Required Field: Please provide a user Id'],
    },
    price: {
      type: Number,
      required: [true, 'Required Field: Please provide the tour price'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    paid: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

// *****/QUERY MIDDLEWARE/*****

bookingSchema.pre(/^find/, function(next){
    this.populate('user').populate({
        path: 'tour',
        select: 'name'
    })
    next();
})

const Booking = mongoose.model('Booking',bookingSchema);

module.exports = Booking;
