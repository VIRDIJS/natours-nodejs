// *****/MODULE IMPORTS AND REQUIRE DECLARATIONS/*****

const mongoose = require('mongoose');
const Tour = require('./tourModel');

// *****/SCHEMA DEFINITION/*****

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review field is required'],
    },
    rating: {
      type: Number,
      min: [1.0, 'Minimum rating cannot be less than 1.0'],
      max: [5.0, 'Rating Average cannot exceed 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Tour is a required field'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Please provide the author of this review'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

// *****/INDEX/*****
reviewSchema.index({tour:1,user:1},{unique: true})

// *****/QUERY MIDDLEWARE/*****

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// reviewSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'user',
//     select: '-__v',
//   });
//   next();
// });

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  if(stats.length > 0){
    await Tour.findByIdAndUpdate(tourId,{
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating
    })
  } else {
    await Tour.findByIdAndUpdate(tourId,{
      ratingsAverage: 4.5,
      ratingsQuantity: 0
    })
  }
};

reviewSchema.post('save',function(){
  // "this" inside the function refers to current review
  this.constructor.calcAverageRatings(this.tour)
})

reviewSchema.pre(/^findOneAnd/, async function(next){
  this.r = await this.findOne();
  // console.log(this.r);
  next();
})

reviewSchema.post(/^findOneAnd/,async function(){
  // await this.findOne() does not work here because query has already executed.
  await this.r.constructor.calcAverageRatings(this.r.tour)
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
