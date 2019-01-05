/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var mongoose = require('mongoose');
mongoose.connect(process.env.DB, { useNewUrlParser: true });

//Message Board Modeling
const replySchema = new mongoose.Schema({
  _id: String,
  text: String,
  created_on: Date,
  delete_password: String,
  reported: false
});
const threadSchema = new mongoose.Schema({
  board: String, // general
  text: String,
  delete_password: String,
  replies: [replySchema],
  created_on: Date,
  bumped_on: Date,
  reported: Boolean
});

const Thread = mongoose.model('Thread', threadSchema);

var expect = require('chai').expect;

module.exports = function (app) {
  
  let threadRouter = app.route('/api/threads/:board');
  
  threadRouter.post((req, res) => {
    let newThread = new Thread({
      board: req.params.board,
      text: req.body.text,
      delete_password: req.body.delete_password,
      replies: [],
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false
    });
    newThread.save((err, thread) => {
      res.redirect('/b/'+req.params.board);
    });
  });
  
  threadRouter.get((req, res) => {
    Thread.find({board: req.params.board})
      .sort({bumped_on: -1})
      .limit(10)
      .exec((err, threads) =>{
        threads.map(thread => {
          if (thread) {
          thread.delete_password = undefined;
          thread.reported = undefined;
          thread.replies = thread.replies.slice(0, 3);
          }})
        res.json(threads);
      })
  });
  
  threadRouter.delete((req, res) => {
    Thread.findById(req.body.thread_id, (err, thread) => {
      if (req.body.delete_password == thread.delete_password) {
        Thread.findByIdAndDelete(req.body.thread_id, () => res.send('success'));
      }  else
        res.send('incorrect password');
    });
  })
  
  threadRouter.put((req, res) => {
    Thread.findById(req.body.thread_id, (err, thread) => {
        thread.reported = true;
        thread.save(() => res.send('success'));
    });
  })
  
  let replyRouter = app.route('/api/replies/:board');
  
  replyRouter.post((req, res) => {
    Thread.findById(req.body.thread_id, (err, thread) => {
      let reply = {
        _id: req.body.thread_id + thread.replies.length,
        text: req.body.text,
        created_on: new Date(),
        delete_password: req.body.delete_password,
        reported: false
      }
      thread.replies.push(reply);
      thread.bumped_on = new Date();
      thread.save((err, thread) => {
        res.redirect('/b/'+req.params.board+'/'+req.body.thread_id);
      });
    });
  });
  
  replyRouter.get((req, res) => {
    Thread.findById(req.body.thread_id, (err, thread) =>{
      if (thread) {
        thread.delete_password = undefined;
        thread.reported = undefined;
      }
      res.json(thread);
    });
  });
  
  replyRouter.delete((req, res) => {
    Thread.findById(req.body.thread_id, (err, thread) => {
      let reply = thread.replies.fiter(r => r['_id'] == req.reply_id)[0];
      if (req.body.delete_password == reply.delete_password) {
        reply.text = '[deleted]';
        thread.save(() => res.send('success'));
      }  else
        res.send('incorrect password');
    });
  })
  
  replyRouter.put((req, res) => {
    Thread.findById(req.body.thread_id, (err, thread) => {
      let reply = thread.replies.fiter(r => r['_id'] == req.reply_id)[0];
      reply.reported = true;
      thread.save(() => res.send('success'));
    });
  })
};
