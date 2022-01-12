const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const BootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Bootcamp name is invalid'],
      unique: true,
      trim: true,
      maxlength: [50, 'Bootcamp name cannot be more than 50 characters'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    websiteUrl: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Please use a valid URL',
      ],
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
      unique: [true, 'Email must be unique'],
    },
    phone: {
      type: String,
      match: [
        /\+?(?:[ -]?\d+)+|(\d+)(?:[ -]\d+)/,
        'Please add a valid phone number',
      ],
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    location: {
      // GeoJSON Point
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
      formattedAddress: String,
      street: String,
      city: String,
      zipcode: String,
      country: String,
    },
    subject: {
      type: [String],
      required: true,
      enum: [
        'Mobile Development',
        'Web Development',
        'Data Science',
        'Cloud Architecting',
        'UI/UX',
        'DevOps',
        'Other',
      ],
    },
    ratingAvg: {
      type: Number,
      min: 1,
      max: 5,
    },
    costAvg: {
      type: Number,
    },
    images: {
      type: String,
      default: 'image-not-found.jpg',
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  {
    timestamps: true,
  }
);

// Slugify the bootcamp name using mongoose middlewares
BootcampSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true,
  });
  next();
});

// Geocode the location field
BootcampSchema.pre('save', async function (next) {
  const location = await geocoder.geocode(this.address);
  this.location = {
    type: 'Point',
    coordinates: [location[0].longitude, location[0].latitude],
    formattedAddress: location[0].formattedAddress,
    street: location[0].streetName,
    city: location[0].city,
    zipcode: location[0].zipcode,
    country: location[0].countryCode,
  };

  // Prevent saving address in DB
  this.address = undefined;

  next();
});

// Cascade delete
BootcampSchema.pre('remove', async function (next) {
  await this.model('Course').deleteMany({ bootcamp: this._id });
});

// Reverse populate with virtual, .virtual('the_field_with_virtual', options pk <-> fk)
BootcampSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'bootcamp',
  justOne: false,
});

module.exports = mongoose.model('Bootcamp', BootcampSchema);
