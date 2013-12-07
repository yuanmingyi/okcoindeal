// initPage.js
(function() {    
    jQuery(document).ready(function() {
        var form = document.forms[0];
        var pwdInput = form['pwd'];
        var buyPriceInput = form['buyPrice'];
        var sellPriceInput = form['sellPrice'];
        var intervalInput = form['interval'];
        var coinInput = form['coin'];
        var isMonitor = false;        
        var autoDeal = false;
                    
        jQuery('a#loginLink').on('click', null, null, function() {
            okcoinUtility.login();
        });
        jQuery(form['startButton']).on('click', null, null, function() {            
            dealRobot.Setup({coin:coinInput.value,
                             pwd:pwdInput.value,
                             interval:intervalInput.value});
            dealRobot.Start();
        });
        jQuery(form['stopButton']).on('click', null, null, function() {            
            dealRobot.Stop();
        });
        jQuery(form['buyAll']).on('click', null, null, function() {
            chaodi.buyAll('ltc', buyPriceInput.value, pwdInput.value);
        });
        jQuery(form['sellAll']).on('click', null, null, function() {
            chaodi.sellAll('ltc', sellPriceInput.value, pwdInput.value);
        });
        jQuery(form['withdrawAll']).on('click', null, null, function() {
            chaodi.withdrawAll(coinInput.value);
        });
        jQuery(form['monitor']).on('click', null, null, function() {
            isMonitor = !isMonitor;
            chaodi.monitor(coinInput.value, isMonitor, intervalInput.value);
            this.value = isMonitor ? "stop monitor" : "start monitor";
        });
        jQuery(form[name='autoDeal']).on('click', null, null, function() {
            autoDeal = !autoDeal;
            chaodi.setAuto(autoDeal, function() {
                return {buyPrice: buyPriceInput.value, sellPrice: sellPriceInput.value, pwd:pwdInput.value, coin:coinInput.value, interval:intervalInput.value};
            });
            this.value = autoDeal ? "stop auto deal" : "start auto deal";
        });
    });
}());