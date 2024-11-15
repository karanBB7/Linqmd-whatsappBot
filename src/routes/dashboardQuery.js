const mysql = require('mysql2');
const { Sequelize } = require('sequelize');
const { Feedback } = require('../../models');
const { AiAnswer } = require('../../models');
const { AiQuestion } = require('../../models');

const db = mysql.createConnection({
  host: 'database-1.c16iememgraw.ap-south-1.rds.amazonaws.com',
  user: 'drupaladmin',
  password: 'Linqmd*123',
  database: 'drupal'  
});

function getCancled(app) {
    app.get('/getCancled/:userId', (req, res, next) => {
        const userId = req.params.userId;
        
        const query = `
          SELECT mobile_number 
          FROM booking_appointment 
          WHERE user_id = ? 
          AND status = 2 
          AND LENGTH(mobile_number) = 12`;
      
        db.query(query, [userId], (err, results) => {
          if (err) {
            res.send(500, { error: err.message });
            return next(err);
          }
          
          if (!results || results.length === 0) {
            res.send(200, { message: "No data found" });
          } else {
            res.send(200, results);
          }
          next();
        });
    });
}


function getFeedbackNumber(app) {
    app.get('/getFeedbackNumber/:userId', async (req, res) => {
        const doctor_user_id = req.params.userId;

        try {
            const feedbacks = await Feedback.findAll({
                attributes: [
                    [Sequelize.fn('DISTINCT', Sequelize.col('fromNumber')), 'fromNumber']
                ],
                where: { doctor_user_id },
                raw: true
            });

            const uniqueNumbers = feedbacks.map(feedback => feedback.fromNumber);

            res.send({
                success: true,
                count: uniqueNumbers.length,
                numbers: uniqueNumbers
            });
            
        } catch (error) {
            console.error('Error fetching feedback numbers:', error);
            res.send(500, { 
                error: 'Internal Server Error',
                message: error.message 
            });
        }
    });

    app.get('/getFeedback/:phoneNumber/:doctorId', async (req, res) => {
        const fromNumber = req.params.phoneNumber;
        const doctor_user_id = req.params.doctorId;
        
        try {
            const feedbacks = await Feedback.findAll({
                attributes: ['rating', 'feedback', 'reasonForVisit', 'updatedAt'],
                where: { 
                    fromNumber,
                    doctor_user_id 
                },
                order: [['booking_id', 'DESC']],
                raw: true
            });
    
            const uniqueFeedbacks = [];
            let latestFeedback = {
                rating: null,
                feedback: null,
                reasonForVisit: null,
                timeStamp:null,
            };
    
            for (let feedback of feedbacks) {
                if (latestFeedback.rating === null && feedback.rating !== null) {
                    latestFeedback.rating = feedback.rating;
                }
                if (latestFeedback.feedback === null && feedback.feedback !== null) {
                    latestFeedback.feedback = feedback.feedback;
                }
                if (latestFeedback.reasonForVisit === null && feedback.reasonForVisit !== null) {
                    latestFeedback.reasonForVisit = feedback.reasonForVisit;
                }
                if (latestFeedback.timeStamp === null && feedback.updatedAt !== null) {
                    latestFeedback.timeStamp = feedback.updatedAt;
                }
             
                if (latestFeedback.rating !== null && 
                    latestFeedback.feedback !== null && 
                    latestFeedback.reasonForVisit !== null) {
                    uniqueFeedbacks.push({...latestFeedback});
                    latestFeedback = {
                        rating: null,
                        feedback: null,
                        reasonForVisit: null,
                        timeStamp: null
                    };
                }
             }
    
            if (latestFeedback.rating !== null || 
                latestFeedback.feedback !== null || 
                latestFeedback.reasonForVisit !== null) {
                uniqueFeedbacks.push(latestFeedback);
            }
    
            if (!feedbacks.length) {
                return res.status(404).send({
                    success: false,
                    message: 'No feedback found'
                });
            }
    
            res.send({
                success: true,
                feedbacks: uniqueFeedbacks
            });
            
        } catch (error) {
            console.error('Error fetching feedback:', error);
            res.status(500).send({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    });

    app.get('/getQandANumber/:userId', async (req, res) => {
        const doc_user_id = req.params.userId;
    
        try {
            const result = await AiQuestion.findAll({
                attributes: [
                    [Sequelize.fn('DISTINCT', Sequelize.col('phoneNumber')), 'phoneNumber'],
                    [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('id'))), 'questionCount']
                ],
                where: { doc_user_id },
                group: ['phoneNumber'],
                raw: true
            });
    
            const formattedResult = result.map(item => ({
                phoneNumber: item.phoneNumber,
            }));
    
            res.send({
                success: true,
                count: formattedResult.length,
                data: formattedResult
            });
            
        } catch (error) {
            console.error('Error fetching AiQuestion numbers:', error);
            res.status(500).send({ 
                error: 'Internal Server Error',
                message: error.message 
            });
        }
    });


    app.get('/getQuestion/:phoneNumber/:doctorId', async (req, res) => {
        const fromNumber = req.params.phoneNumber;
        const doc_user_id = req.params.doctorId;
        try {
            const questions = await AiQuestion.findAll({
                attributes: ['question', 'updatedAt'],
                where: { 
                    phoneNumber: fromNumber,
                    doc_user_id
                },
                order: [['id', 'DESC']],
                raw: true
            });
    
            const formattedQuestions = questions.map(question => ({
                question: question.question,
                timestamp: question.updatedAt
            }));
    
            res.send({
                success: true,
                count: formattedQuestions.length,
                data: formattedQuestions
            });
    
        } catch (error) {
            console.error('Error fetching AiQuestion:', error);
            res.status(500).send({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    });

    app.get('/getAnswer/:phoneNumber/:doctorId', async (req, res) => {
        const fromNumber = req.params.phoneNumber;
        const doc_user_id = req.params.doctorId;
        try {
            const answer = await AiAnswer.findAll({
                attributes: ['answer', 'updatedAt'],
                where: { 
                    phoneNumber: fromNumber,
                    doc_user_id
                },
                order: [['id', 'DESC']],
                raw: true
            });
    
            const formattedAnswers = answer.map(answer => ({
                answer: answer.answer,
                timestamp: answer.updatedAt
            }));
    
            res.send({
                success: true,
                count: formattedAnswers.length,
                data: formattedAnswers
            });
    
        } catch (error) {
            console.error('Error fetching AiAnswer:', error);
            res.status(500).send({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    });




}






module.exports = { getCancled, getFeedbackNumber };