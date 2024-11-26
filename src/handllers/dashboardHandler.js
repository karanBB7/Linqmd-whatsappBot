const { Dms } = require('../../models');


async function insertMessageIntoDashboard(phone, message){
    try{
        await Dms.create({
            toNumber: phone,
            messages:message
        });

        // console.log("normal  Message:",{
        //     "message":message,
        //     "Phone":phone
        // });

    }catch(error){
        console.error('Error inserting to dashboard:', error);
    }
}

async function insertListMessageIntoDashboard(phone, listMessage) {
    const body = listMessage.interactive.body;
    const values = Object.values(body);
    const text = values[0];

    await Dms.create({
        toNumber: phone,
        messages:text
    });

    // console.log("normal  Message:",{
    //     "message":text,
    //     "Phone":phone
    // });


}


module.exports = { insertMessageIntoDashboard, insertListMessageIntoDashboard };