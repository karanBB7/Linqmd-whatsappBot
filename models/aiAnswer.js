module.exports = (sequelize, DataTypes) => {
  const AiAnswer = sequelize.define("AiAnswer", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    doc_user_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'aiAnswer',
    timestamps: true 
  });

  return AiAnswer;
};