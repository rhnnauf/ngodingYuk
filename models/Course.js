const mongoose = require('mongoose');

const CourseSchema = mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, 'Please add the course title'],
    },
    description: {
      type: String,
      required: [true, 'Please add the description'],
    },
    duration: {
      type: String,
      required: [true, 'Please add the duration'],
    },
    tuition: {
      type: Number,
      required: [true, 'Please add the tuition cost'],
    },
    minimumSkill: {
      type: String,
      required: [true, 'Please add the minimum skill'],
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    bootcamp: {
      type: mongoose.Schema.ObjectId,
      ref: 'Bootcamp',
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ================ Static vs Regular Method ===================
// Static can directly invoke through a model, ex:
// Course.calculate();

// Whereas Method need to be instantiated first, ex:
// const course = Course.find();
// course.calculate();

// Static
CourseSchema.statics.setCostAvg = async function (bootcampId) {
  const data = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: '$bootcamp',
        costAvg: { $avg: '$tuition' },
      },
    },
  ]);

  try {
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      costAvg: Math.ceil(data[0].costAvg / 10) * 10,
    });
  } catch (error) {
    console.log(error);
  }
};

// Invoke a function to add average cost to the current bootcamp => after save
CourseSchema.post('save', async function (next) {
  this.constructor.setCostAvg(this.bootcamp);
});

// Invoke a function to re-calculate average cost to the current bootcamp => before delete
CourseSchema.pre('remove', async function (next) {
  this.constructor.setCostAvg(this.bootcamp);
});

module.exports = mongoose.model('Course', CourseSchema);
