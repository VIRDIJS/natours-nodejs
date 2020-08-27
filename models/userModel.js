// *****/MODULE IMPORTS AND REQUIRE DECLARATIONS/*****
const crypto = require('crypto');
const mongoose = require('mongoose');
// const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcrypt');

// *****/SCHEMA DEFINITION/*****
// name, email, photo, password, passwordConfirm
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name!'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address!'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email address.'],
    },
    photo: {
      type: String,
      default:'default.jpg'
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password.'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password.'],
      validate: {
        //   Only works on document save. Will not work when using methods like findOneAndUpdate
        validator: function (el) {
          return el === this.password;
        },
        message: 'password and passwordConfirm do not match!',
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// *****/MIDDLEWARE/*****

userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }
  user.password = await bcrypt.hash(user.password, 8);
  user.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second
  next();
});

// -----/QUERY MIDDLEWARE/----
userSchema.pre(/^find/, function (next) {
  // Return only active users
  this.find({ active: {$ne: false} });
  next();
});

// *****/INSTANCE METHODS/*****

userSchema.methods.comparePasswords = async function (
  inputPassword,
  storedPassword
) {
  return await bcrypt.compare(inputPassword, storedPassword);
};

userSchema.methods.changedPasswordAfter = async function (JwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JwtTimestamp < changedTimestamp;
  }
  // false? Password not changed since jwt token was issued
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log(
  //   { resetToken: resetToken },
  //   { passwordResetToken: this.passwordResetToken }
  // );

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Serving only the required fields
// This method is adopted from Task Manager project of Udemy Course by Andrew Mead
userSchema.methods.toJSON = function(){
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  // delete userObject.tokens
  // delete userObject.avatar
  return userObject
}


// *****/CREATE MODEL FROM SCHEMA/*****
const User = mongoose.model('User', userSchema);

// *****/MODULE EXPORT/*****
module.exports = User;
