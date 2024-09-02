module.exports = (sequelize, DataTypes) => {
  const Tokens = sequelize.define("tokens", {
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
    }
   
  }, {
    tableName: 'tokens',
    timestamps: true 
  });

  return Tokens;
};