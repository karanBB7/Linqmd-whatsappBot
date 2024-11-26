module.exports = (sequelize, DataTypes) => {
  const Dmr = sequelize.define("Dmr", {
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
    }

  }, {
    tableName: 'dmr',
    timestamps: true 
  });

  return Dmr;
};