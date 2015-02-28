"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable(
      "memo",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        memo: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        next_tweet_flag: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        set_time: {
          type: DataTypes.DATE,
        },
        done_flag: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      },{
        charset: "UTF8"
      }
    );
    done();
  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    done();
  }
};
