module.exports = (sequelize, DataTypes) => {
  const Dms = sequelize.define("Dms", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    toNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    messages: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'dms',
    timestamps: true 
  });

  return Dms;
};