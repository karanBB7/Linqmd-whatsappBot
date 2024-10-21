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
    doctor_user_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    doctor: DataTypes.TEXT,
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fromNumber: {
      type: DataTypes.STRING,
      allowNull: false
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
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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