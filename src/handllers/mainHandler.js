const { createToken, setUserToken, decodeToken } = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage, sendListMessage, generalList } = require('../middleware/whatsappMiddleware');
const { getAppointmentRecords, getDoctorData, getDoctorByName, getAppointment } = require('../services/drupalApiServices');
const { setUserState, clearUserState} = require('../services/stateManager');




const { sendYesOrNo, sendAllServices } = require('../utils/messageUtils');


    async function handleFindDoctor(fromNumber) {
      try {
          const appointmentData = await getAppointmentRecords(fromNumber);

          if ('message' in appointmentData) {
              await sendWhatsAppMessage(fromNumber, "Sorry, we couldn't find any appointments for you.");
              clearUserState(fromNumber);
              return;
          }

          await sendWhatsAppMessage(fromNumber, "As per our records, you have visited the following doctors previously. Please choose the doctor you want to communicate with");

          const listMessage = {
              title: 'Select Doctor',
              body: 'Please select the doctor you want to communicate with',
              options: Object.values(appointmentData).map(doctor => ({
                  id: doctor.uid,
                  title: doctor.docname,
                  description: 'Select Doctor'
              }))
          };

          await new Promise(resolve => setTimeout(resolve, 2000));
          await generalList(fromNumber, listMessage);
          setUserState(fromNumber, 'awaitingDoctorSelection');
      } catch(error) {
          await sendWhatsAppMessage(fromNumber, "An error occurred while processing your request. Please try again later.");
          clearUserState(fromNumber);
      }
    }


    async function handleFindDoctorExplicit(fromNumber, extrackedDoctor) {

      try {
        const doctorsDataByName = await getDoctorByName(extrackedDoctor);
        
        if (doctorsDataByName && doctorsDataByName.uid) {
          const token = createToken(fromNumber, doctorsDataByName.uid, doctorsDataByName.username, doctorsDataByName.docname);  
          setUserToken(fromNumber, token); 

          const message = `Hello! I am <Stella>, ${doctorsDataByName.docname} secretary. How can I help you today?`;
          await sendWhatsAppMessage(fromNumber, message);
  
          await sendAllServices(fromNumber);
          
        } else {
          await sendWhatsAppMessage(fromNumber, "Sorry, we couldn't find a doctor with that name. Please try again.");
        }
      } catch (error) {
        console.error("Error in doctor authentication process:", error);
        await sendWhatsAppMessage(fromNumber, "An error occurred while processing your request. Please try again later.");
      }

    }




    async function handleInitialMessage(fromNumber, listid) {
        const doctorsData = await getDoctorData(listid);
        const token = createToken(fromNumber, doctorsData.uid, doctorsData.username, doctorsData.docname);  
        // console.log("token", token);
        setUserToken(fromNumber, token); 
        const message = `Hello! I am <Stella>, ${doctorsData.docname} secretary. How can I help you today?`;
        await sendWhatsAppMessage(fromNumber, message);
        await sendAllServices(fromNumber);

    }

    async function manageAppointment(fromNumber, token) {


      const decodedToken = decodeToken(token);
      const doc_id = decodedToken.uid;  
      const username = decodedToken.username;  
      const appointmentData = await getAppointment(doc_id, fromNumber);

      if(appointmentData.status === 'success'){
        const listMessage = 
        {
          title: 'Manage your appointment',
          body: 'Please select the respective activity.',
          options: ['View Appointment', 'Cancel Appointment']
        };
      await sendListMessage(fromNumber, listMessage);
      setUserState(fromNumber, 'awaitingSelection'); 
      }else{
        sendWhatsAppMessage(fromNumber, `Please book an appointment via https://www.linqmd.com/doctor-profile/${username}#appointment`)

        await sendYesOrNo(fromNumber);
      }
      
    }


module.exports.handleInitialMessage = handleInitialMessage;
module.exports.handleFindDoctor = handleFindDoctor;
module.exports.handleFindDoctorExplicit = handleFindDoctorExplicit;
module.exports.manageAppointment = manageAppointment;