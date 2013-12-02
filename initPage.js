// initPage.js
(function() {    
    jQuery(document).ready(function() {
        jQuery('a#loginLink').on('click', null, null, function() {
            okcoinUtility.login();
        });
        jQuery("input[name='startButton']").on('click', null, null, function() {
            var pwd = document.forms[0]['pwd'].value;
            //console.info('pwd:'+pwd);            
            dealRobot.Setup({pwd:pwd});
            dealRobot.Start();
        });
        jQuery("input[name='stopButton']").on('click', null, null, function() {
            //console.info('stop button pressed');
            dealRobot.Stop();
        });
    });
}());