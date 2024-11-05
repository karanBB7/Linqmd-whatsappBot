$(document).ready(function() {
    $('.contact').click(function() {
        $('.welcome').fadeOut('fast', function() {
            $('.chatHistory').fadeIn('fast');
        });
    });
});