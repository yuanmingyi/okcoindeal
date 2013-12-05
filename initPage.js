// initPage.js
(function() {    
    jQuery(document).ready(function() {
        var pwd = document.forms[0]['pwd'].value;
        var buyPrice = document.forms[0]['buyPrice'].value;
        var sellPrice = document.forms[0]['sellPrice'].value;
        var interval = document.forms[0]['interval'].value;
        var coin = document.forms[0]['coin'].value;
        var open = true;
        
        jQuery('a#loginLink').on('click', null, null, function() {
            okcoinUtility.login();
        });
        jQuery("input[name='startButton']").on('click', null, null, function() {            
            dealRobot.Setup({coin:coin,pwd:pwd,interval:interval});
            dealRobot.Start();
        });
        jQuery("input[name='stopButton']").on('click', null, null, function() {            
            dealRobot.Stop();
        });
        jQuery("input[name='buyAll']").on('click', null, null, function() {
            chaodi.buyAll('ltc', buyPrice, pwd);
        });
        jQuery("input[name='sellAll']").on('click', null, null, function() {
            chaodi.sellAll('ltc', sellPrice, pwd);
        });
        jQuery("input[name='withdrawAll']").on('click', null, null, function() {
            chaodi.withdrawAll(coin);
        });
        jQuery("input[name='monitor']").on('click', null, null, function() {
            chaodi.monitor(coin, open, interval);
            open = !open;
            this.value = open ? "start monitor" : "stop monitor";
        });
    });
}());