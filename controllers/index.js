var router = require('express').Router();
var User = require('../models').User;
var Tweet = require('../models').Tweet;

module.exports = function(io) {
  router.get('/', function(req, res) {
    var allTweets = []
    User.findAll({
        include: [{
          model: Tweet,
          required: true
        }]
      })
      .then(function(users) {
        users.forEach(function(user) {
          var tweets = user.dataValues.Tweets
          tweets.forEach(function(tweet) {
            var obj = {
              userId: user.dataValues.id,
              id: tweet.dataValues.id,
              name: user.dataValues.name,
              text: tweet.dataValues.tweet,
              url: user.dataValues.pictureUrl,
            }
            allTweets.push(obj)
          })
        })
        res.render('index', {
          title: 'Twitter.js',
          tweets: allTweets
        });
      });
  });

  router.get('/users/:name', function(req, res) {
    var name = req.params.name;
    User.findOne({
      where: {
        name: name
      }
    }).then(function(user) {
      user.getTweets().then(function(tweets) {
        var usersTweets = []
        tweets.forEach(function(tweet) {
          usersTweets.push({
            userId: user.dataValues.id,
            name: name,
            text: tweet.dataValues.tweet,
            url: user.dataValues.pictureUrl,
            id: tweet.dataValues.id,
          })
        })
        res.render('index', {
          title: 'Twitter.js - Posts by ' + name,
          tweets: usersTweets,
          showForm: true,
          name: name
        });
      });
    });
  });

  router.get('/users/:userId/tweets/:id', function(req, res) {
    var userId = req.params.userId;
    var id = req.params.id;
    Tweet.findOne({
      include: [{
        model: User,
        required: true
      }],
      where: {
        id: id,
        userId: userId
      }
    }).then(function(tweet) {
      var name = tweet.User.dataValues.name
      var oneTweet = [{
        userId: userId,
        name: name,
        text: tweet.dataValues.tweet,
        url: tweet.User.dataValues.pictureUrl,
        id: tweet.dataValues.id,
      }]
      res.render('index', {
        title: 'Twitter.js - Posts by ' + name,
        tweets: oneTweet,
        showForm: true,
        name: name
      });
    });
  });

  router.post('/submit', function(req, res) {
    var name = req.body.name;
    var text = req.body.text;
    User.findOne({
      where: {
        name: name
      }
    }).then(function(user) {
      console.log(user)
      Tweet.create({
          UserId: user.dataValues.id,
          tweet: text
        })
        .then(function(tweet) {
          console.log(user.dataValues.id)
          Tweet.findOne({
            where: {
              UserId: user.dataValues.id,
              tweet: text
            }
          }).then(function(tweet) {
            var obj = {
              id: tweet.dataValues.id,
              userId: tweet.dataValues.UserId,
              name: name,
              text: text,
              url: user.dataValues.pictureUrl,
            }
            io.sockets.emit("new_tweet", obj);
          });
          res.redirect('/');
        })
    });
  });

  return router;
};