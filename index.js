const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})
let User = mongoose.model('user', userSchema)

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true},
  description: { type: String, required: true},
  duration: { type: Number, required: true},
  date: { type: Date, required: true, default: new Date()}
})
let Exercise = mongoose.model('exercise', exerciseSchema)

app.use(cors())
app.use(express.static('public'))
app.use('/', bodyParser.urlencoded({ extended: false }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  let username = req.body.username;
  let newUser = new User({ username: username});
  newUser.save();
  res.json(newUser)
})

app.get('/api/users', (req, res) => {
  User.find({}).then((users) => res.json(users));
})

app.post('/api/users/:_id/exercises', (req, res) => {
  let userId = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  const exerciseObj = {
    userId: userId,
    description: description,
    duration: duration
  }
  if (req.body.date != '') {
    exerciseObj.date = req.body.date;
  }
  let newExercise = new Exercise(exerciseObj);
  User.findById(userId).then((user) => {
    if (!user) {
      res.json({ error: "Invalid User" })
      return;
    }
    newExercise.save();
    res.json({
      _id: user._id, username: user.username,
      description: newExercise.description, duration: newExercise.duration,
      date: new Date(newExercise.date).toDateString()
    })
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  let userId = req.params._id;
  limit = limit ? parseInt(limit) : limit;
  User.findById(userId).then((user) => {
    console.log(user);
    let queryObj = { userId: userId}
    if (from || to) {
      queryObj.date = {}
      if (from) {
        queryObj.date['$gte'] = from;
      }
      if (to) {
        queryObj.date['$lte'] = to;
      }
    }
    console.log('query: ', queryObj, 'limit: ', limit);
    Exercise.find(queryObj).limit(limit).then((exercises) => {
      let resObj = {
        _id: user._id,
        username: user.username
      }
      exercises = exercises.map(el => {
        return {
          description: el.description,
          duration: el.duration,
          date: new Date(el.date).toDateString()
        }
      })
      resObj.log = exercises;
      resObj.count = exercises.length;

      res.json(resObj);
    })
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
