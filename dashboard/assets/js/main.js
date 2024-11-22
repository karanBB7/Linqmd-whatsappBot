$(document).ready(function () {
    const API_BASE = 'http://localhost:3002';
    let clickType = '';

    const formatTimeAndDate = timestamp => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffTime = Math.abs(now - time);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dateStr = `${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()}`;
        const timeAgo = diffDays > 0 ? `${diffDays} day${diffDays > 1 ? 's' : ''} ago` :
                       diffHours > 0 ? `${diffHours} hour${diffHours > 1 ? 's' : ''} ago` :
                       'Just now';
        
        return { dateStr, timeAgo };
    };

    const handleApiError = error => {
        console.error('API Error:', error);
        $('.chatarea').html('Error loading data: ' + error);
    };

    const getDoctorUid = () => {
        const doctorUid = $('.doctor-select option:selected').val();
        if (!doctorUid) {
            alert('Please select a doctor first');
            return false;
        }
        return doctorUid;
    };

    $('.doctor-select').select2({
        dropdownParent: $('.doctor-cell'),
        placeholder: 'Select Doctor',
        allowClear: false,
        width: '100%'
    }).on('select2:select', () => $('.patient-item').hide());

    $.ajax({
        url: `${API_BASE}/users`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.data.data) {
                const selectElement = $('.doctor-select');
                selectElement.find('option:not(:first)').remove();
                response.data.data.forEach(doctor => {
                    selectElement.append(`<option value="${doctor.uid}">${doctor.username}</option>`);
                });
            }
        },
        error: function(error) {
            console.error('Error fetching doctors:', error);
        }
    });

    $('.appt-cancel').click(function() {
        $('.dateFilter').show();
        $('.date-search-form').hide();
        $('.chatnumber, .patientName').empty(); 
        clickType = 'cancel';
        $('.chatarea').empty();
        loadList(`${API_BASE}/getCancled/`, 'No cancelled appointments found', true);
    });
    
    $('.feedback').click(function() {
        $('.dateFilter').hide();
        $('.date-search-form').hide();
        $('.chatnumber, .patientName').empty();
        clickType = 'feedback';
        $('.chatarea').empty();
        loadList(`${API_BASE}/getFeedbackNumber/`, 'No feedback numbers found');
    });
    
    $('.questions').click(function() {
        $('.dateFilter').hide(); 
        $('.date-search-form').hide();
        $('.chatnumber, .patientName').empty();
        clickType = 'questions';
        loadList(`${API_BASE}/getQandANumber/`, 'No numbers found');
    });
    
    $('.all').click(function() {
        $('.dateFilter').hide(); 
        $('.date-search-form').hide();
        $('.chatnumber, .patientName').empty();
        clickType = 'all';
        $('.chatarea').empty();
        loadList(`${API_BASE}/getPhone`, 'No numbers found', false, true);
    });

    function loadList(url, emptyMessage, isCancelled = false, isAll = false) {
        const doctorUid = getDoctorUid();
        if (!doctorUid) return;

        const apiUrl = isAll ? url : `${url}${doctorUid}`;
        
        $.ajax({
            url: apiUrl,
            method: 'GET',
            success: function(response) {
                let container = $('.patient-item').parent();
                $('.patient-item').remove();
                
                if (!response.data?.length && !response.numbers?.length && (!Array.isArray(response) || !response.length)) {
                    container.append(`<div class="patient-item">${emptyMessage}</div>`);
                    return;
                }

                const items = isAll ? response.data : (response.data || response.numbers || response);
                items.forEach(item => {
                    const number = item.fromNumber || item.phoneNumber || item.mobile_number || item;
                    const className = isCancelled ? 'getCancledData' : 'phonenumber';
                    const dataAttr = isCancelled ? `data-id="${item.id}"` : '';
                    container.append(`<div class="patient-item ${className}" ${dataAttr}>${number}</div>`);
                });
            },
            error: handleApiError
        });
    }

    $(document).on('click', '.phonenumber, .getCancledData', function() {
        $('.chatnumber, .patientName').empty();
        const number = $(this).text().trim();
        const doctorUid = getDoctorUid();
        if (!doctorUid) return;

        $.ajax({
            url: `${API_BASE}/getName/${number}`,
            method: 'GET',
            success: function(response) {
                $('.chatnumber').text(number);
                $('.patientName').text(response.patient_name);
            }
        });

        if (clickType === 'feedback') {
            handleFeedback(number, doctorUid);
        } else if (clickType === 'questions') {
            handleQuestions(number, doctorUid);
        } else if (clickType === 'all') {
            handleAllChat(number);
        } else if (clickType === 'cancel') {
            handleCancelDetails($(this).data('id'));
        }
    });

    function handleFeedback(number, doctorUid) {
        $.ajax({
            url: `${API_BASE}/getFeedback/${number}/${doctorUid}`,
            method: 'GET',
            success: function(response) {
                const chatarea = $('.chatarea').empty();
                response.feedbacks.forEach(feedback => {
                    if (feedback.rating || feedback.feedback || feedback.reasonForVisit) {
                        const { dateStr, timeAgo } = formatTimeAndDate(feedback.timeStamp);
                        chatarea.append(`
                            <div class="feedbackWrapper">
                                <div class="timestamp">
                                    <span class="timeago">(${timeAgo})</span>
                                    <span class="date">${dateStr}</span> 
                                </div>
                                ${feedback.rating ? `<div class="rating"><span class="feedbacktitle">Recomendation score: </span>${feedback.rating}</div>` : ''}
                                ${feedback.feedback ? `<div class="feedbackMessage"><span class="feedbacktitle">Feedback: </span>${feedback.feedback}</div>` : ''}
                                ${feedback.reasonForVisit ? `<div class="visit"><span class="feedbacktitle">Reason for visit: </span>${feedback.reasonForVisit}</div>` : ''}
                            </div>
                        `);
                    }
                });
            },
            error: handleApiError
        });
    }

    function handleQuestions(number, doctorUid) {
        const $chatContainer = $('.chatarea').empty().append('<div>Loading chat history...</div>');
        
        $.when(
            $.ajax({url: `${API_BASE}/getQuestion/${number}/${doctorUid}`, method: 'GET'}),
            $.ajax({url: `${API_BASE}/getAnswer/${number}/${doctorUid}`, method: 'GET'})
        ).then(function(questionResponse, answerResponse) {
            const messages = [
                ...questionResponse[0].data.map(q => ({type: 'question', text: q.question, time: new Date(q.timestamp)})),
                ...answerResponse[0].data.map(a => ({type: 'answer', text: a.answer, time: new Date(a.timestamp)}))
            ].sort((a, b) => a.time - b.time);

            renderMessages($chatContainer, messages);
        }).fail(handleApiError);
    }

    function handleAllChat(number) {
        const $chatContainer = $('.chatarea').empty().append('<div>Loading chat history...</div>');
        
        $.when(
            $.ajax({url: `${API_BASE}/getSentChat/${number}`, method: 'GET'}),
            $.ajax({url: `${API_BASE}/getReceivedChat/${number}`, method: 'GET'})
        ).then(function(sentResponse, receivedResponse) {
            const messages = [
                ...receivedResponse[0].data.map(r => ({
                    type: 'question',
                    text: r.messages || r.title || r.description,
                    time: new Date(r.timestamp)
                })),
                ...sentResponse[0].data.map(s => ({
                    type: 'answer',
                    text: s.messages,
                    time: new Date(s.timestamp)
                }))
            ].filter(m => m.text).sort((a, b) => b.time - a.time);

            renderMessages($chatContainer, messages, true);
        }).fail(handleApiError);
    }

    function handleCancelDetails(bookingId) {
        $.ajax({
            url: `${API_BASE}/getCancledDetails/${bookingId}`,
            method: 'GET',
            success: function(response) {
                const booking = response[0];
                const createdDateFormat = formatTimeAndDate(booking.created_date);
                const bookingDateFormat = formatTimeAndDate(booking.booking_date);
                
                $('.chatarea').empty().append(`
                    <div class="feedbackWrapper">
                        <div><span class="fw-bold fs-6">Booking Id: </span>${booking.id}</div>
                        <div><span class="fw-bold fs-6">Patient Name: </span>${booking.patient_name}</div>
                        <div><span class="fw-bold fs-6">Mobile Number: </span>${booking.mobile_number}</div>
                        <div><span class="fw-bold fs-6">Clinic Name: </span>${booking.clinic_name}</div>
                        <div><span class="fw-bold fs-6">Time Slot: </span>${booking.time_slot}</div>
                        <div><span class="fw-bold fs-6">Time Slot Name: </span>${booking.time_slot_name}</div>
                        <div><span class="fw-bold fs-6">Created Date: </span>${createdDateFormat.dateStr} (${createdDateFormat.timeAgo})</div>
                        <div><span class="fw-bold fs-6">Booking Date: </span>${bookingDateFormat.dateStr} (${bookingDateFormat.timeAgo})</div>
                        <div><span class="fw-bold fs-6">Source: </span>${booking.source}</div>
                        <div><span class="fw-bold fs-6">Visit Reason: </span>${booking.visit_reason}</div>
                    </div>
                `);
            },
            error: handleApiError
        });
    }

    function renderMessages($container, messages, addWrapper = false) {
        $container.empty();
        if (!messages.length) {
            $container.append('<div>No chat history found</div>');
            return;
        }

        const $wrapper = addWrapper ? 
            $container.append('<div class="chat-container"></div>').find('.chat-container') : 
            $container;

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

            $wrapper.append(`
                <div class="message ${msg.type}">
                    <div class="message-bubble">
                        <div class="text">${msg.text}</div>
                        <div class="timestamp">${date} ${time}</div>
                    </div>
                </div>
            `);
        });
    }


    $('.date-search-form').submit(function(e) {
        e.preventDefault();
        const doctorUid = $('.doctor-select option:selected').val();
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();
        
        if (!startDate || !endDate) {
            alert('Please select both dates');
            return;
        }
    
        $.ajax({
            url: `${API_BASE}/getCancledByDateRange/${doctorUid}`,
            method: 'GET',
            data: {
                startDate: startDate,
                endDate: endDate
            },
            success: function(response) {
                let container = $('.patient-item').parent();
                $('.patient-item').remove();
                
                if (Array.isArray(response)) {
                    response.forEach(item => {
                        container.append(`<div class="patient-item getCancledData" data-id="${item.id}">${item.mobile_number}</div>`);
                    });
                } else if (response.message) {
                    container.append(`<div class="patient-item">${response.message}</div>`);
                }
    
                $('#startDate').val('');  
                $('#endDate').val('');    

            },
            error: function(error) {
                console.error('Error:', error);
                $('.patient-item').html('Error loading data: ' + error);
            }
        });
    });

    $('.dateFilter').click(function(){
        const $form = $('.date-search-form');
        const $this = $(this);
        
        if($form.is(':hidden')) {
            $form.show();
            $this.text('Hide Date Filter');
        } else {
            $form.hide();
            $this.text('Show Date Filter');
        }
    });


});