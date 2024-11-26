module.exports = (sequelize, DataTypes) => {
    const AiQuestion = sequelize.define("AiQuestion", {
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
      question: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      tableName: 'aiQuestion',
      timestamps: true 
    });
  
    return AiQuestion;
  };