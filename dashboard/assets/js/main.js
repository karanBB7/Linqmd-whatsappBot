$(document).ready(function () {
    $('.doctor-select').select2({
        dropdownParent: $('.doctor-cell'),
        placeholder: 'Select Doctor',
        allowClear: false,
        width: '100%'
    });
});


$(document).ready(function() {
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
});