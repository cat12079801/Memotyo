"use strict";

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable(
      "user",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.INTEGER,
          unique: true,
          allowNull: false,
        },
        screen_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        enable_flag: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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
    dne();
  },

  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    done();
  }
}
