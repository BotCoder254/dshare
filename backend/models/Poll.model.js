const mongoose = require('mongoose');

const PollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a poll title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true
    },
    votes: {
      type: Number,
      default: 0
    }
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  votingSystem: {
    type: String,
    enum: ['single-choice', 'multiple-choice', 'ranked-choice', 'score-voting'],
    default: 'single-choice'
  },
  privacy: {
    type: String,
    enum: ['public', 'private', 'password-protected'],
    default: 'public'
  },
  password: {
    type: String,
    select: false
  },
  expiresAt: {
    type: Date
  },
  allowGuestVoting: {
    type: Boolean,
    default: true
  },
  showResults: {
    type: String,
    enum: ['always', 'after-vote', 'after-close'],
    default: 'always'
  },
  voters: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    // For multiple-choice, ranked-choice, and score voting
    choices: [{
      option: {
        type: mongoose.Schema.Types.ObjectId
      },
      rank: Number,  // For ranked-choice voting
      score: Number  // For score voting (1-10)
    }],
    // Store the voting data as JSON for flexibility
    voteData: {
      type: Object
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  slug: {
    type: String,
    unique: true
  }
});

// Generate a random slug before saving
PollSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this._id + '-' + this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 8);
  }
  next();
});

module.exports = mongoose.model('Poll', PollSchema);
