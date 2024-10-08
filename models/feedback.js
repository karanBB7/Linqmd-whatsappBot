module.exports = (sequelize, DataTypes) => {
  const Feedback = sequelize.define("Feedback", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    booking_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fromNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    doctor: DataTypes.TEXT,
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reasonForVisit: {
      type: DataTypes.TEXT,
      allowNull: true
    },
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