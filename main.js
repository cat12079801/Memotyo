var conf = require('./config/config.js');

var twitter = require('ntwitter');
var tw = new twitter({
  consumer_key: conf.ntwitter["consumer_key"],
  consumer_secret: conf.ntwitter["consumer_secret"],
  access_token_key: conf.ntwitter["access_token_key"],
  access_token_secret: conf.ntwitter["access_token_secret"]
});

tw.stream('user', {'replies': 'all'}, function(stream) {
  stream.on('data', function (data) {
    if(data.user === undefined || data.entities.user_mentions[0] === undefined){
      console.log(data);
    }else if(data.entities.user_mentions[0].id == 3043673340){
      console.log(data.text);
      var date = new Date();
      tw.updateStatus(date.getHours() + "時" + date.getMinutes() + "分" + date.getSeconds() + "秒をお知らせします", {}, function(err, data){});
    }
  });
});
