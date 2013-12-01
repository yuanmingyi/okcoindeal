// for downloading the history data

(function() {
    var baseUrl = 'https://vip.btcchina.com/trade/history';
    
    var allData = [];
    var count = 0;
    var page = 1;
    
    jQuery.get(baseUrl, null, function(res) {
        
    }); 
    
    function loadPage(var pageUrl) {
        jQuery.get(pageUrl, null, function(res) {
            loadPage(
        });
    }
    
    
})();