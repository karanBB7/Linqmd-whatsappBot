module.exports = (sequelize, DataTypes) => {
  const Receiver = sequelize.define("Receiver", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fromNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    messages: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    buttonText: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    listid: {
      type: DataTypes.STRING,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }

  }, {
    tableName: 'receiver',
    timestamps: true 
  });

  return Receiver;
};