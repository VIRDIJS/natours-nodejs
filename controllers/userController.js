const multer = require('multer');
const sharp = require('sharp');

// ******/Request Handlers/*******
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// *****/MULTER CONFIGURATION/******
// STORAGE (FILENAME AND DESTINATION)

// -----/USE IF NO IMAGE PRE-PROCESSING REQUIRED/-----
// const multerStorage = multer.diskStorage({
//   // cb ---> callback
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     //  cb ---> callback
//     const ext = file.mimetype.split('/')[1];
//     // null --> no error, Generate file name with format 'user-userid-timestamp.file extension'
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

// MULTER FILTER
// Filter for file types image,csv etc
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Upload functionality limited to image file types only!',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

// -----/IMAGE PRE-PROCESSING USING SHARP NPM PACKAGE/-----
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'Sorry this route is not yet defined. Please use /signup instead',
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  // 1. Create error if user tries to update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not configured for updating passwords. Please use /updateMyPassword route',
        400
      )
    );
  }

  // 2. Filter out unwanted fields that are not allowed to be updated through this route
  const filteredBody = filterObj(req.body, 'name', 'email');

  // update database photo field of the user document with the new file name
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // 3. Update data
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'Success!',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'Success!',
    data: null,
  });
});

// ----/Not for updating Passwords!! Refer to forgotPassword and resetPasswords of authController/----
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

//   module.exports = {
//       createUser,
//       getAllUsers,
//       getUser,
//       updateUser,
//       deleteUser
//   }
