const axios = require('axios');
const https = require('https');

const mysql = require('mysql2/promise');
require('dotenv').config();


const API_URL = 'https://www.linqmd.com/api/getUser';
const API_AUTH = 'Basic OmJHbHVjVzFrT2xOQWFWQnJTRzFHVTJGcE9Ybz0=';

async function getUser(){
    try{
        const response = await axios.get(API_URL,{
            headers: {
              'Content-Type': 'application/json',
              'Authorization': API_AUTH
            },

            httpsAgent: new https.Agent({  
                rejectUnauthorized: false // Only for development
            })
            
          });

          return response.data;
          
    }catch(error){
        console.error("Error while getting User", error);
    }
}




module.exports = { getUser };
