const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) => {
    return catchAsync(async (req, res, next) => {
        const id = req.params.id;
        const doc = await Model.findByIdAndDelete(id);
        if(!doc){
          return next(new AppError('Document Not Found',404))
        }
        res.status(204).json({
          status: 'Success!',
          data: null,
        });
      });
}

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const id = req.params.id;
    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if(!doc){
      return next(new AppError('Document Not Found',404))
    }
  
    res.status(200).json({
      status: 'Success!',
      data: {
        doc,
      },
    });
  });
}

exports.createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'Success!',
      data: {
        doc
      },
    });
  });
}

exports.getOne = (Model,populateOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if(populateOptions) {
      query = query.populate(populateOptions);
    }
    const doc = await query
    if(!doc){
      return next(new AppError('Document Not Found',404))
    }
    res.status(200).json({
      status: 'Success!',
      data: {
        data: doc
      },
    });
  });
}

exports.getAll = (Model)=>{
  return catchAsync(async (req, res, next) => {
    // console.log(req.requestTime);
    // To allow nested GET reviews on tour (Hack)
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }
  
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
      const docs = await features.query;

    // const docs = await features.query.explain(); // For query statistics
    // Send Response
    res.status(200).json({
      status: 'Success!',
      results: docs.length,
      data: {
        docs
      },
    });
  });
}