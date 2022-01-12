const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      match: [/^[A-Za-z ]+$/, 'Name can only consist of alphabet and spaces'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: [true, 'Email must be unique'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    role: {
      type: String,
      enum: ['User', 'Publisher'],
      default: 'User',
    },
    password: {
      type: String,
      select: false,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must contain at least 6 characters'],
      match: [
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/,
        'Password must contain one uppercase, one lowercase, and one numeric',
      ],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Encrypt user password using mongoose middleware
UserSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
