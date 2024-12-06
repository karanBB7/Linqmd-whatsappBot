const { createToken, setUserToken } = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage, sendListMessage, generalList, sendFeedbackRating } = require('../middleware/whatsappMiddleware');
const { checkAppointment, getAppointmentRecords, getDoctorData } = require('../services/viewService');
const { setUserState,clearUserState} = require('../services/stateManager');
const { otherAppointments } = require('../handllers/viewHandlers');
const { captureOvercome } = require('../handllers/feedbackHandler');




    async function handleFindDoctor(fromNumber) {
        // try {
        //     const appointmentData = await checkAppointment(fromNumber);
        //     if (appointmentData.success === 'true') {
        //         const token = createToken(appointmentData.Username, fromNumber, appointmentData.Docfullname, appointmentData.booking_id, appointmentData.doctor_user_id);  
                
        //         setUserToken(fromNumber, token);        
        //         if (appointmentData.appointment_tense === 'future') {
        //         const message = `Dear ${appointmentData.patient_name}, You have an appointment with ${appointmentData.Docfullname} at ${appointmentData.clinic_name} on ${new Date(appointmentData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${appointmentData.slotTime}.`;
                
        //         await sendWhatsAppMessage(fromNumber, message);
        //         await new Promise(resolve => setTimeout(resolve, 1000));
        //         const listMessage = {
        //             title: 'Do you want to?',
        //             body: 'Please select the respective activity.',
        //             options: ['View Appointment', 'Cancel Appointment', 'Ask Question']
        //         };

        //         await new Promise(resolve => setTimeout(resolve, 2000));
        //         await sendListMessage(fromNumber, listMessage);
                
        //         setUserState(fromNumber, 'awaitingSelection');
        
        //         } else {
        //         const message = `Hello, ${appointmentData.patient_name}, thank you for consulting, ${appointmentData.Docfullname}. on ${new Date(appointmentData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${appointmentData.slotTime}. Please help other patients like you, by providing a detailed feedback on your experience.`;
        //         await sendWhatsAppMessage(fromNumber, message);
        //         await new Promise(resolve => setTimeout(resolve, 2000));
        //         await captureOvercome(fromNumber, token);
        //         }
        //     } else {
        //         await sendWhatsAppMessage(fromNumber, "Sorry, we couldn't find any appointments for you.");
        //         clearUserState(fromNumber);
        //       }

        // } catch (error) {
        // console.error('Error in handleInitialMessage:', error);
        // await sendWhatsAppMessage(fromNumber, "An error occurred while processing your request. Please try again later.");
        // }

        try {
          const appointmentData = await getAppointmentRecords(fromNumber);
      
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
          console.error('Error in handleInitialMessage:', error);
          await sendWhatsAppMessage(fromNumber, "An error occurred while processing your request. Please try again later.");
      }


    }


    async function handleInitialMessage(fromNumber, listid) {
        const doctorsData = await getDoctorData(listid);
        const token = createToken(fromNumber, doctorsData.uid, doctorsData.username, doctorsData.docname);  
        setUserToken(fromNumber, token); 

        const message = `Hello! I am <Stella>, ${doctorsData.docname} secretary. How can I help you today?`;
        await sendWhatsAppMessage(fromNumber, message);

        await new Promise(resolve => setTimeout(resolve, 1000));


        const listMessage = {
          title: "Do you want to?",
          body: "Please select the respective activity.",
          options: [
            {
              id: "askquestion",
              title: "Ask doctor questions",
              description: "Get answers about your doctor's medical expertise and specializations"
            },
            {
              id: "manageapp",
              title: "Manage appointment",
              description: "View or modify your scheduled appointments" 
            },
            {
              id: "feedback",
              title: "Give feedback",
              description: "Share your experience with us"
            }
          ]
        };
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        await generalList(fromNumber, listMessage);
        
        setUserState(fromNumber, 'awaitingSelection');


    }







  
  async function handleOtherAppointments(fromNumber) {
    try {
      const checkforotherappointments = await otherAppointments(fromNumber);
  
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      const listMessage = checkforotherappointments ? {
        title: 'Do you want to?',
        body: 'Please select the respective activity.',
        options: ['Give us your feedback', 'View Appointment', 'Cancel Appointment', 'Ask Question']
      } : {
        title: 'Do you want to?',
        body: 'Please select the respective activity.',
        options: ['Give us your feedback', 'Ask Question']
      };
  
      await sendListMessage(fromNumber, listMessage);
      setUserState(fromNumber, 'awaitingSelection');
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }


  async function sendListAgain(fromNumber){
    const appointmentData = await checkAppointment(fromNumber);
    if (appointmentData.appointment_tense === 'future') {
      const listMessage = {
        title: 'Do you want to?',
        body: 'Please select the respective activity.',
        options: ['View Appointment', 'Cancel Appointment', 'Ask Question']
    };
    await sendListMessage(fromNumber, listMessage);
    setUserState(fromNumber, 'awaitingSelection');
    }else{
      await handleOtherAppointments(fromNumber);
    }
  }

  async function sendYesOrNo(fromNumber){
      const listMessage = {
        title: 'Do you have anything else?',
        body: 'Please select the respective activity.',
        options: ['Yes', 'No']
    };
    await sendListMessage(fromNumber, listMessage);
    setUserState(fromNumber, 'awaitingSelection');
    
  }

  
  module.exports = {handleInitialMessage ,handleFindDoctor, sendListAgain, sendYesOrNo};
  