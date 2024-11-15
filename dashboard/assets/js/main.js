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
        
        let timeAgo;
        if (diffDays > 0) {
            timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            timeAgo = 'Just now';
        }
     
        return {
            dateStr,
            timeAgo
        };
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
                const doctors = response.data.data;
                const selectElement = $('.doctor-select');
                
                selectElement.find('option:not(:first)').remove();
                
                doctors.forEach(function(doctor) {
                    selectElement.append(
                        $('<option>', {
                            value: doctor.uid,
                            text: doctor.username
                        })
                    );
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching doctors:', error);
        }
    });


    $('.appt-cancel').click(function() {
        clickType = 'cancel';
        const selectedOption = $('.doctor-select option:selected');
        const doctorUid = selectedOption.val();
        const doctorName = selectedOption.text();
        $('.chatarea').empty();
        
        if (!doctorUid) {
            alert('Please select a doctor first');
            return;
        }

        $.ajax({
            url: 'http://localhost:3002/getCancled/' + doctorUid,
            method: 'GET',
            success: function(response) {
                let container = $('.patient-item').parent();
                $('.patient-item').remove(); 
                
                if (response.message === "No data found") {
                    container.append('<div class="patient-item">No cancelled appointments found</div>');
                } else {
                    response.forEach(function(item) {
                        container.append(`<div class="patient-item phonenumber">${item.mobile_number}</div>`);
                    });
                }
            },
            error: function(xhr, status, error) {
                $('.patient-item').html('Error loading data: ' + error);
            }
        });
    });


    $('.feedback').click(function() {
        clickType = 'feedback';
        $('.chatarea').empty();
        const selectedOption = $('.doctor-select option:selected');
        const doctorUid = selectedOption.val();
        if (!doctorUid) {
            alert('Please select a doctor first');
            return;
        }
    
        $.ajax({
            url: 'http://localhost:3002/getFeedbackNumber/' + doctorUid,
            method: 'GET',
            success: function(response) {
                let container = $('.patient-item').parent();
                $('.patient-item').remove(); 
                
                if (response.count === 0) {
                    container.append('<div class="patient-item">No feedback numbers found</div>');
                } else {
                    response.numbers.forEach(function(number) {
                        container.append(`<div class="patient-item phonenumber">${number}</div>`);
                    });
                }
            },
            error: function(xhr, status, error) {
                $('.patient-item').html('Error loading data: ' + error);
            }
        });
    });

    $(document).on('click', '.phonenumber', function() {
        const number = $(this).text();
        const selectedOption = $('.doctor-select option:selected');
        const doctorUid = selectedOption.val();
        
        $('.chatnumber').text(number);
        
        if(clickType === 'feedback') {
            $.ajax({
                url: `http://localhost:3002/getFeedback/${number}/${doctorUid}`,
                method: 'GET',
                success: function(response) {
                    let chatarea = $('.chatarea');
                    chatarea.empty();
     
                    response.feedbacks.forEach(function(feedback) {
                        if (feedback.rating || feedback.feedback || feedback.reasonForVisit) {
                            const { dateStr, timeAgo } = formatTimeAndDate(feedback.timeStamp);
                            
                            let feedbackHtml = '<div class="feedbackWrapper">';
                            
                            feedbackHtml += `<div class="timestamp">
                                <span class="timeago">(${timeAgo})</span>
                                <span class="date">${dateStr}</span> 
                            </div>`;
                            
                            if (feedback.rating) {
                                feedbackHtml += `<div class="rating">
                                    <span class="feedbacktitle">Recomendation score: </span>${feedback.rating}
                                </div>`;
                            }
                            
                            if (feedback.feedback) {
                                feedbackHtml += `<div class="feedbackMessage">
                                    <span class="feedbacktitle">Feedback: </span>${feedback.feedback}
                                </div>`;
                            }
                            
                            if (feedback.reasonForVisit) {
                                feedbackHtml += `<div class="visit">
                                    <span class="feedbacktitle">Reason for visit: </span>${feedback.reasonForVisit}
                                </div>`;
                            }
                            
                            feedbackHtml += '</div>';
                            chatarea.append(feedbackHtml);
                        }
                    });
                },
                error: function(xhr, status, error) {
                    $('.chatarea').html('Error loading feedback: ' + error);
                }
            });
        } else {
            $('.chatarea').empty();
        }
    });
});


