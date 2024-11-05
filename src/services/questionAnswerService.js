const axios = require('axios');

const API_URL = 'http://localhost:5000/ask';

async function getAnaswer(question, doctorusername, fromNumber) {

    console.log("doctor username", doctorusername);

    try {
        const response = await axios.post(API_URL, {
            question: question,
            doctorusername: doctorusername,
            usernumber: fromNumber
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        return response;
    } catch(error) {
        console.error('Error connecting to the bot:', error);
        throw error;
    }
}

module.exports = {getAnaswer};