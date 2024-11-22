$(document).ready(function() {
    const API_BASE = 'http://localhost:3002';
    let dataTable;
    let allDoctors = [];

    // Utility Functions
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
    
    
    
function initDataTable() {
  function initDataTable() {
        if (dataTable) {
            dataTable.destroy();
        }
        
        dataTable = $('#doctorTable').DataTable({
            paging: false,
            searching: false,
            info: false,
            order: [], // Disable initial sorting
            columnDefs: [{
                targets: [0], // Target the Doctor column
                orderable: true
            }]
        });
    }
}

    // Create row structure for each doctor
    function createDoctorRow(doctor) {
        return `
            <tr data-doctor-id="${doctor.uid}">
                <td class="doctor-cell">${doctor.username}</td>
                <td class="reason-cell">
                    <div class="appt-cancel patient-section">
                        <div class="patient-section-header">Appointment Cancel</div>
                    </div>
                    <div class="feedback patient-section">
                        <div class="patient-section-header">Feedback</div>
                    </div>
                    <div class="questions patient-section">
                        <div class="patient-section-header">Questions</div>
                    </div>
                    <div class="others patient-section">
                        <div class="patient-section-header">Others</div>
                    </div>
                </td>
                <td class="patient-cell">
                    <div class="appt-cancel patient-section">
                        <div class="patient-numbers-wrapper"></div>
                    </div>
                    <div class="feedback patient-section">
                        <div class="patient-numbers-wrapper"></div>
                    </div>
                    <div class="questions patient-section">
                        <div class="patient-numbers-wrapper"></div>
                    </div>
                    <div class="others patient-section">
                        <div class="patient-numbers-wrapper"></div>
                    </div>
                </td>
                <td class="chat-cell">
                    <div class="chatarea">
                        Chat conversations are shown here
                    </div>
                </td>
            </tr>
        `;
    }

    // Load section numbers
    function loadList(doctorUid, url, container, emptyMessage, isCancelled = false, isAll = false) {
        const apiUrl = isAll ? url : `${url}${doctorUid}`;
        
        $.ajax({
            url: apiUrl,
            method: 'GET',
            success: function(response) {
                container.empty();
                
                if (!response.data?.length && !response.numbers?.length && (!Array.isArray(response) || !response.length)) {
                    return;
                }

                const items = isAll ? response.data : (response.data || response.numbers || response);
                items.forEach(item => {
                    const number = item.fromNumber || item.phoneNumber || item.mobile_number || item;
                    const className = isCancelled ? 'getCancledData' : 'phonenumber';
                    const dataAttr = isCancelled ? `data-id="${item.id}"` : '';
                    const sectionClass = container.closest('.patient-section').attr('class').split(' ')[0];
                    container.append(`<div class="patient-number ${className}" ${dataAttr} data-section="${sectionClass}">${number}</div>`);
                });
            },
            error: handleApiError
        });
    }

    // Load all sections for a doctor row
    function loadAllSections(doctorRow) {
        const doctorUid = doctorRow.data('doctor-id');

        // Load Appointment Cancel numbers
        loadList(doctorUid, `${API_BASE}/getCancled/`, 
            doctorRow.find('.appt-cancel .patient-numbers-wrapper'), 
            'No cancelled appointments found', 
            true
        );

        // Load Feedback numbers
        loadList(doctorUid, `${API_BASE}/getFeedbackNumber/`, 
            doctorRow.find('.feedback .patient-numbers-wrapper'), 
            'No feedback numbers found'
        );

        // Load Questions numbers
        loadList(doctorUid, `${API_BASE}/getQandANumber/`, 
            doctorRow.find('.questions .patient-numbers-wrapper'), 
            'No numbers found'
        );

        // Load Others numbers
        loadList(doctorUid, `${API_BASE}/getPhone`, 
            doctorRow.find('.others .patient-numbers-wrapper'), 
            'No numbers found', 
            false, 
            true
        );
    }

    // Handle number clicks based on section
    function handleNumberClick(element) {
        const number = $(element).text().trim();
        const doctorRow = $(element).closest('tr');
        const doctorUid = doctorRow.data('doctor-id');
        const chatArea = doctorRow.find('.chatarea');
        const section = $(element).data('section');

        // Get patient name
        $.ajax({
            url: `${API_BASE}/getName/${number}`,
            method: 'GET',
            success: function(response) {
                // Handle displaying name if needed
            }
        });

        // Handle different sections
        switch(section) {
            case 'appt-cancel':
                handleCancelDetails($(element).data('id'), chatArea);
                break;
            case 'feedback':
                handleFeedback(number, doctorUid, chatArea);
                break;
            case 'questions':
                handleQuestions(number, doctorUid, chatArea);
                break;
            case 'others':
                handleAllChat(number, chatArea);
                break;
        }
    }

    // Handle specific chat types
    function handleFeedback(number, doctorUid, chatArea) {
        $.ajax({
            url: `${API_BASE}/getFeedback/${number}/${doctorUid}`,
            method: 'GET',
            success: function(response) {
                chatArea.empty();
                response.feedbacks.forEach(feedback => {
                    if (feedback.rating || feedback.feedback || feedback.reasonForVisit) {
                        const { dateStr, timeAgo } = formatTimeAndDate(feedback.timeStamp);
                        chatArea.append(`
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

    function handleQuestions(number, doctorUid, chatArea) {
        chatArea.empty().append('<div>Loading chat history...</div>');
        
        $.when(
            $.ajax({url: `${API_BASE}/getQuestion/${number}/${doctorUid}`, method: 'GET'}),
            $.ajax({url: `${API_BASE}/getAnswer/${number}/${doctorUid}`, method: 'GET'})
        ).then(function(questionResponse, answerResponse) {
            const messages = [
                ...questionResponse[0].data.map(q => ({type: 'question', text: q.question, time: new Date(q.timestamp)})),
                ...answerResponse[0].data.map(a => ({type: 'answer', text: a.answer, time: new Date(a.timestamp)}))
            ].sort((a, b) => a.time - b.time);

            renderMessages(chatArea, messages);
        }).fail(handleApiError);
    }

    function handleAllChat(number, chatArea) {
        chatArea.empty().append('<div>Loading chat history...</div>');
        
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

            renderMessages(chatArea, messages, true);
        }).fail(handleApiError);
    }

    function handleCancelDetails(bookingId, chatArea) {
        $.ajax({
            url: `${API_BASE}/getCancledDetails/${bookingId}`,
            method: 'GET',
            success: function(response) {
                const booking = response[0];
                const createdDateFormat = formatTimeAndDate(booking.created_date);
                const bookingDateFormat = formatTimeAndDate(booking.booking_date);
                
                chatArea.empty().append(`
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

    // Bind global events
    function bindEvents() {
        // Patient number click handler
        $('#doctorTableBody').on('click', '.patient-number', function() {
            $('.patient-number').removeClass('selected');
            $(this).addClass('selected');
            handleNumberClick(this);
        });

        // Scroll handler for patient sections
        $('#doctorTableBody').on('scroll', '.patient-numbers-wrapper', function(e) {
            e.stopPropagation();
        });
    }

    // Fetch and display doctors
    
    
    function renderDoctors(doctors) {
        const tbody = $('#doctorTableBody');
        tbody.empty();
        
        doctors.forEach(doctor => {
            const row = $(createDoctorRow(doctor));
            tbody.append(row);
            loadAllSections(row);
        });
        
        // Redraw the table without sorting
        if (dataTable) {
            dataTable.draw(false);
        }
    }

    // Add click handler for Doctor column header
    function setupDoctorColumnClick() {
        $('#doctorTable thead th:first-child').off('click').on('click', function() {
            if (allDoctors.length > 0) {
                // Take first doctor and move to end
                const firstDoctor = allDoctors.shift();
                allDoctors.push(firstDoctor);
                
                // Render doctors in new order
                renderDoctors(allDoctors);
            }
        });
    }

    // Fetch and display doctors
    function fetchDoctors() {
        $.ajax({
            url: `${API_BASE}/users`,
            method: 'GET',
            success: function(response) {
                if (response.success && response.data.data) {
                    // Store all doctors
                    allDoctors = response.data.data;
                    
                    // Initial render
                    renderDoctors(allDoctors);
                    
                    // Initialize DataTable after rendering
                    initDataTable();
                    
                    // Setup click handler
                    setupDoctorColumnClick();
                }
            },
            error: function(error) {
                console.error('Error fetching doctors:', error);
                const tbody = $('#doctorTableBody');
                tbody.empty();
                allDoctors = [{ username: 'Unknown', uid: 'unknown' }];
                
                renderDoctors(allDoctors);
                initDataTable();
                setupDoctorColumnClick();
            }
        });
    }


    // Initialize
    fetchDoctors();
    bindEvents();
});