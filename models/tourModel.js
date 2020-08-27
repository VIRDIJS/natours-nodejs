// *****/MODULE IMPORTS AND REQUIRE DECLARATIONS/*****

const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

// *****/SCHEMA DEFINITION/*****

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is a required field'],
      unique: true,
      trim: true,
      maxlength: [40, 'Name field cannot exceed 40 characters'],
      minlength: [5, 'Name field must be at least 5 characters long'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Duration is a required field'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'maxGroupSize is a required field'],
    },
    difficulty: {
      type: String,
      lowercase: true,
      required: [true, 'difficulty is a required field'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Acceptable values for difficulty: easy, medium, difficult',
      },
    },
    // rating: {
    //   type: Number,
    //   default: 4.5
    // },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1.0, 'Minimum rating cannot be less than 1.0'],
      max: [5.0, 'Rating Average cannot exceed 5.0'],
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'price is a required field'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount ({VALUE}) cannot exceed the price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'summary is a required field'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'imageCover is a required field'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// *****/DEFINE INDEXES IF ANY/*****

// tourSchema.index({price: 1})
tourSchema.index({price: 1, ratingsAverage: -1})
tourSchema.index({slug: 1})
tourSchema.index({startLocation: '2dsphere'})

// *****/VIRTUALS PROPERTIES/*****
tourSchema.virtual('reviews',{
  ref:'Review',
  localField: '_id',
  foreignField: 'tour'
})


// *****/DOCUMENT MIDDLEWARE: Runs before the .save() and .create() events/*****

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function(next){
//   // Because callback function inside map returns promise so guidesPromises will be an array of promises
//   // Promise.all (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
//   const guidesPromises = this.guides.map(async id => await User.findById(id))
//   this.guides = await Promise.all(guidesPromises)
//   next();
// })

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });


// *****/QUERY MIDDLEWARE/*****

tourSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took: ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});


// *****/AGGREGATE MIDDLEWARE/*****

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this)
//   next();
// });

// *****/VIRTUAL PROPERTY/*****

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
