var conf = require('./config/config.js');
var index = require('./config/index.js');

// ツイート重複を防ぐための開発用変数
// この関数は拾い物
var random_s = function() {
  var a = 'abcdefghijklmnopqrstuvwxyz'
    + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    + '0123456789'
    + "!\"#$%&'()-=^~\\|`[{;+:*]},<.>/?_";
  a = a.split('');
  var s = '';
  for (var i = 0; i < 7; i++) {
      s += a[Math.floor(Math.random() * a.length)];
  }
  return "\n\n" + s;
};

var twitter = require('ntwitter');
var tw = new twitter({
  consumer_key: conf.ntwitter["consumer_key"],
  consumer_secret: conf.ntwitter["consumer_secret"],
  access_token_key: conf.ntwitter["access_token_key"],
  access_token_secret: conf.ntwitter["access_token_secret"]
});

var Sequelize = require('sequelize');
var sequelize = new Sequelize(
  conf.sequelize["database_name"],
  conf.sequelize["user_name"],
  conf.sequelize["password"],
  {
    host: conf.sequelize["host"],
    dialect: conf.sequelize["dialect"]
  }
);

var User = sequelize.define('user', {
  twitter_id: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false,
  },
  screen_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  enable_flag: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
},{
  charset: "UTF8",
  underscored: true,
});
var Memo = sequelize.define('memo', {
  memo: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  next_tweet_flag: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },
  set_time: {
    type: Sequelize.DATE,
  },
  done_flag: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
},{
  charset: "UTF8",
  underscored: true,
});

Memo.belongsTo(User);

User.sync({});
Memo.sync({});

var timer = new Date(3000, 1, 1, 0, 0, 0);

set_timer();

setInterval(function(){
  if(timer.getTime() <= new Date().getTime()){

    Memo.find({
      where: {
        next_tweet_flag: false,
        set_time: timer,
        done_flag: false,
      }
    }).success(function(memo){
      if(!memo){
        set_timer();
        return;
      }

      User.find({
        where: {
          id: memo["user_id"],
        }
      }).success(function(user){
        tw.updateStatus(
          "@" + user["screen_name"] + "\n\n" + memo["memo"] + random_s(),
          {}, function(error, success){
            if(error){
              return;
            }
            Memo.update({
              done_flag: true,
            }, {
              where: {
                id: memo["id"],
              }
            });
            setTimeout(function(){
              set_timer();
            }, 1000);
          }
        );
      });
    });

  }else{
    // 特に何もしない
  }
}, 5000);

tw.stream('user', {}, function(stream) {
  stream.on('data', function (tw_data) {
    if(tw_data.user === undefined){
      //console.log(tw_data);
      require('fs').writeFile('log/log.txt', JSON.stringify(tw_data, null, '  '));
    }else if(tw_data.entities.user_mentions[0] === undefined){
      tweet_check(tw_data);
    }else if(tw_data.entities.user_mentions[0].id == conf.my_twitter_id && tw_data.entities.user_mentions[1] === undefined){
      //console.log(tw_data.text);
      //var date = new Date();
      //tw.updateStatus(date.getHours() + "時" + date.getMinutes() + "分" + date.getSeconds() + "秒をお知らせします", {}, function(err, tw_data){});
      User.find({
        where: {
          twitter_id: tw_data.user.id,
        }
      }).success(function(user){
        if(user !== null){
          existing_user(user, tw_data);
        }else{
          tw.getFollowersIds(conf.my_twitter_id, function(err, follower_ids){
            if(follower_ids.indexOf(tw_data.user.id) != -1){
              new_user(user, tw_data);
            }else{
              not_user(user, tw_data);
            }
          });
        }
      });
    }
  });
});

function tweet_check(tw_data){
  User.find({
    where: {
      twitter_id: tw_data.user.id,
    }
  }).success(function(user){
    Memo.findAll({
      where: {
        user_id: user.id,
        next_tweet_flag: true,
        done_flag: false,
      }
    }).success(function(memos){

      if(memos.length == 0) return;

      var send_memo = new Array;
      for(var i = 0 ; i < memos.length ; i++){
        send_memo.push(memos[i]["memo"]);
      }
      tw.updateStatus(
        "@" + tw_data.user.screen_name + "\n\n" + send_memo.join("\n") + random_s(),
        {
          in_reply_to_status_id: tw_data.id_str
        }, function(error, success){

          if(error) return;

          for(var i = 0 ; i < memos.length ; i++){
            Memo.update({
              done_flag: true,
            }, {
              where: {
                id: memos[i]["id"],
              }
            });
          }
        }
      );
    });
  });
}

function not_user(user, tw_data){
  console.log("not user");
  tw.updateStatus(
    "@" + tw_data.user.screen_name + index.not_user + random_s(),
    {
      in_reply_to_status_id: tw_data.id_str
    }, function(error, success){}
  );
}

function new_user(user, tw_data){
  if(tw_data.text.match(/使いたい/) != null){
    console.log("ok");
    User.create({
      twitter_id: tw_data.user.id,
      screen_name: tw_data.user.screen_name,
      enable_flag: true,
    });
    tw.createFriendship(tw_data.user.id, function(error, success){
      tw.updateStatus(
        "@" + success.screen_name + index.new_user["want_to_use"] + random_s(),
        {
          in_reply_to_status_id: tw_data.id_str
        }, function(error, success){}
      );
    });
  }else{
    console.log("no");
    tw.updateStatus(
      "@" + tw_data.user.screen_name + index.new_user["no_want_to_use"] + random_s(),
      {
        in_reply_to_status_id: tw_data.id_str
      }, function(error, success){}
    );
  }
}

function existing_user(user, tw_data){
  console.log("existing user");
  User.find({
    where: {
      twitter_id: tw_data.user.id
    }
  }).success(function(user){
    if(include_time(tw_data.text) == null){
      Memo.create({
        memo: tw_data.text.replace(/^@memotyo_bot[\n ]*/, "").replace(/[ ]*@memotyo_bot[ ]*/, " ").replace(/[\n ]*@memotyo_bot[\n ]*/, "\n"),
        next_tweet_flag: true,
        set_time: null,
        done_flag: false,
        user_id: user.id,
      });
    }else{
      Memo.create({
        memo: tw_data.text.replace(/!.*!/, "").replace(/^@memotyo_bot[\n ]*/, "").replace(/[ ]*@memotyo_bot[ ]*/, " ").replace(/[\n ]*@memotyo_bot[\n ]*/, "\n"),
        next_tweet_flag: false,
        set_time: include_time(tw_data.text),
        done_flag: false,
        user_id: user.id,
      });
    }
  });
}

function include_time(text){
  var time = [];
  var time_detail = [];
  var today = new Date();

  if((time = text.match(/!([1-9]|1[0-2])\/([1-9]|[12][0-9]|3[01]) ([01]?[0-9]|2[0-3])(:[0-5][0-9])?!/)) != null){

    time_detail = time[0].substring(1, time[0].length - 1).split(/[ :/]/);
    var date = new Date(today.getFullYear(), time_detail[0], time_detail[1], time_detail[2], time_detail[3], 0);
    if(date.getTime() < today.getTime()){
      date.setFullYear(Number(date.getFullYear()) + 1);
    }
    return date;

  }else if((time = text.match(/!([1-9]|1[0-2])\/([1-9]|[12][0-9]|3[01])!/)) != null){

    time_detail = time[0].substring(1, time[0].length - 1).split(/[ :/]/);

    var date = new Date(today.getFullYear(), time_detail[0], time_detail[1], 0, 0, 0);
    if(date.getTime() < today.getTime()){
      date.setFullYear(Number(date.getFullYear()) + 1);
    }
    return date;

  }else if((time = text.match(/!([01]?[0-9]|2[0-3]):[0-5][0-9]!/)) != null){

    time_detail = time[0].substring(1, time[0].length - 1).split(/[ :/]/);

    var date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), time_detail[0], time_detail[1], 0);
    if(date.getTime() < today.getTime()){
      date.setDate(Number(date.getDate()) + 1);
    }
    return date;

  }else if((time = text.match(/!([01]?[0-9]|2[0-3])!/)) != null){

    var date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), time[0].substring(1, time[0].length - 1), 0, 0);
    if(date.getTime() < today.getTime()){
      date.setDate(Number(date.getDate()) + 1);
    }
    return date;

  }else{
    return null;
  }
}

function set_timer(){
  Memo.findAll({
    where: {
      next_tweet_flag: false,
      done_flag: false,
    }
  }).success(function(datas){
    if(datas.length == 0){
      timer = new Date(3000, 1, 1, 0, 0, 0);
    }else{
      for(var i = 0 ; i < datas.length ; i++){
        if(timer.getTime() > datas[i]["set_time"].getTime()){
          timer = datas[i]["set_time"]
        }
      }
    }
  });
}
