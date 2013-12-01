// initPage.js
(function() {    
    jQuery(document).ready(function() {
        jQuery('a#loginLink').on('click', null, null, function() {
            okcoinUtility.login();
        });
    });
}());