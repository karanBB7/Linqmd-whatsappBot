$(document).ready(function () {
    let clickType = '';

    function formatTimeAndDate(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffTime = Math.abs(now - time);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dateStr = `${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()}`;
        
        let timeAgo = diffDays > 0 ? `${diffDays} day${diffDays > 1 ? 's' : ''} ago` :
                      diffHours > 0 ? `${diffHours} hour${diffHours > 1 ? 's' : ''} ago` :
                      'Just now';
        
        return { dateStr, timeAgo };
    }

    $('.doctor-select').select2({
        dropdownParent: $('.doctor-cell'),
        placeholder: 'Select Doctor',
        allowClear: false,
        width: '100%'
    });

    $.ajax({
        url: 'http://localhost:3002/users',
        method: 'GET',
        success: function(response) {
            if (response.success && response.data.data) {
                const selectElement = $('.doctor-select');
                selectElement.find('option:not(:first)').remove();
                response.data.data.forEach(doctor => {
                    selectElement.append($('<option>', {
                        value: doctor.uid,
                        text: doctor.username
                    }));
                });
            }
        },
        error: function(error) {
            console.error('Error fetching doctors:', error);
        }
    });

    function loadNumbersList(url, emptyMessage) {
        const doctorUid = $('.doctor-select option:selected').val();
        if (!doctorUid) {
            alert('Please select a doctor first');
            return;
        }

        $.ajax({
            url: `${url}${doctorUid}`,
            method: 'GET',
            success: function(response) {
                let container = $('.patient-item').parent();
                $('.patient-item').remove();
                
                if (response.count === 0 || response.message === "No data found") {
                    container.append(`<div class="patient-item">${emptyMessage}</div>`);
                } else {
                    const numbers = response.data || response.numbers || response;
                    numbers.forEach(item => {
                        const number = item.phoneNumber || item.mobile_number || item;
                        container.append(`<div class="patient-item phonenumber">${number}</div>`);
                    });
                }
            },
            error: function(error) {
                $('.patient-item').html('Error loading data: ' + error);
            }
        });
    }

    $('.appt-cancel').click(function() {
        clickType = 'cancel';
        $('.chatarea').empty();
        loadNumbersList('http://localhost:3002/getCancled/', 'No cancelled appointments found');
    });

    $('.feedback').click(function() {
        clickType = 'feedback';
        $('.chatarea').empty();
        loadNumbersList('http://localhost:3002/getFeedbackNumber/', 'No feedback numbers found');
    });

    $('.questions').click(function() {
        clickType = 'questions';
        loadNumbersList('http://localhost:3002/getQandANumber/', 'No numbers found');
    });



    $(document).on('click', '.phonenumber', function() {
        const number = $(this).text().trim();
        const doctorUid = $('.doctor-select option:selected').val();
        
        $('.chatnumber').text(number);
        
        if (clickType === 'feedback') {
            handleFeedbackClick(number, doctorUid);
        } else if (clickType === 'questions') {
            handleQuestionsClick(number, doctorUid);
        }
    });





    function handleFeedbackClick(number, doctorUid) {
        $.ajax({
            url: `http://localhost:3002/getFeedback/${number}/${doctorUid}`,
            method: 'GET',
            success: function(response) {
                let chatarea = $('.chatarea').empty();
     
                response.feedbacks.forEach(function(feedback) {
                    if (feedback.rating || feedback.feedback || feedback.reasonForVisit) {
                        const { dateStr, timeAgo } = formatTimeAndDate(feedback.timeStamp);
                        chatarea.append(`
                            <div class="feedbackWrapper">
                                <div class="timestamp">
                                    <span class="timeago">(${timeAgo})</span>
                                    <span class="date">${dateStr}</span> 
                                </div>
                                ${feedback.rating ? `
                                    <div class="rating">
                                        <span class="feedbacktitle">Recomendation score: </span>${feedback.rating}
                                    </div>` : ''}
                                ${feedback.feedback ? `
                                    <div class="feedbackMessage">
                                        <span class="feedbacktitle">Feedback: </span>${feedback.feedback}
                                    </div>` : ''}
                                ${feedback.reasonForVisit ? `
                                    <div class="visit">
                                        <span class="feedbacktitle">Reason for visit: </span>${feedback.reasonForVisit}
                                    </div>` : ''}
                            </div>
                        `);
                    }
                });
            },
            error: function(error) {
                $('.chatarea').html('Error loading feedback: ' + error);
            }
        });
    }

    

    function handleQuestionsClick(number, doctorUid) {
        const $chatContainer = $('.chatarea');
        $chatContainer.empty().append('<div>Loading chat history...</div>');
    
        $.when(
            $.ajax({
                url: `http://localhost:3002/getQuestion/${number}/${doctorUid}`,
                method: 'GET'
            }),
            $.ajax({
                url: `http://localhost:3002/getAnswer/${number}/${doctorUid}`,
                method: 'GET'
            })
        ).then(function(questionResponse, answerResponse) {
            questionResponse = questionResponse[0];
            answerResponse = answerResponse[0];
            
            $chatContainer.empty();
            
            if (!questionResponse.data.length && !answerResponse.data.length) {
                $chatContainer.append('<div>No chat history found</div>');
                return;
            }
    
            const messages = [
                ...questionResponse.data.map(q => ({
                    type: 'question',
                    text: q.question,
                    time: new Date(q.timestamp)
                })),
                ...answerResponse.data.map(a => ({
                    type: 'answer',
                    text: a.answer,
                    time: new Date(a.timestamp)
                }))
            ].sort((a, b) => a.time - b.time);
    
            messages.forEach(msg => {
                const date = msg.time.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
                const time = msg.time.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                }).toLowerCase();
    
                $chatContainer.append(`
                    <div class="message ${msg.type}">
                        <div class="message-bubble">
                            <div class="text">${msg.text}</div>
                            <div class="timestamp">${date} ${time}</div>
                        </div>
                    </div>
                `);
            });
        }).fail(function(error) {
            console.error('Error:', error);
            $chatContainer.html('Error loading chat history');
        });
    }


});