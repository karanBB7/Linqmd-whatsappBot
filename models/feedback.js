module.exports = (sequelize, DataTypes) => {
  const Feedback = sequelize.define("Feedback", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fromNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    doctor: DataTypes.TEXT,
    jsonData: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }

  },
  {
    tableName: 'feedback',
    timestamps: true 
  });

  return Feedback;
};
 