var conf = require('./config/config.js');

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
  account_id: {
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
*/
