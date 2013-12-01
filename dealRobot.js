// deal robot
// import okcoinUtility.js
(function() {
    var robot = {};
    var interval = 60000;   // default 60s 
    var timer = null;
    var coin = 'ltc';
    var pwd = 'ymy-2008';
    
    var cnyAvailable = 1000;    
    var coinAvailable = 0;
    var entrustTimeout = 20000;
    
    function updateData(func) {
        okcoinUtility.getAccountInfo(function(account) {
            okcoinUtility.getCurrentData(function(current) {
                okcoinUtility.getMyOpenEntrusts(function(myEntrusts) {
                    okcoinUtility.getRecentDeals(function(coin, function(recentDeals) {
                        okcoinUtility.getRecentEntrusts(function(coin, function(buyRecords, sellRecords) {                            
                            func(account, current, myEntrusts, recentDeals, buyRecords, sellRecords);
                        });
                    });
                });
            });            
        });
    }
    
    function strategy(account, current, myEntrusts, recentDeals, buyRecords, sellRecords) {
        if (!account || !current) {
            // infomation is not enough
            return;
        }
        
        var lastPrice = 0;
        var lastVolume = 0;
        var entrustDiff = 0.05; // 5%
        
        var curPrice = current[coin+'Last'];
        var curVolume = current[coin+'Volume'];
        var hold = false;
        
        if (myEntrusts.length > 0) {
            
        }
        
        // buy if the deal price has rised, and sell if deal price has sinked
        if (lastPrice === 0) {
            lastPrice = curPrice;
        } else {
            if (!hold && curPrice / lastPrice > 1.05) {
                // buy in
                var buyVol = cnyAvailable / curPrice;
                okcoinUtility.submitEntrust(buyVol, curPrice, pwd, 'buy', coin, function(data) {});
            } else if (hold && curPrice / lastPrice < 0/95) {
                // sell out
                okcoinUtility.submitEntrust(coinAvailable, curPrice, pwd, 'sell', coin, function(data) {});
            }            
        }
    }
    
    function dealMethod() {
        updateData(robot.strategy);
    }
    
    robot.Setup = function() {
    };
    
    robot.strategy = strategy;
    
    robot.Start = function() {
        timer = setTimeout("dealMethod()", interval);
    };
    
    robot.Stop = function() {
        if (timer !== null) {
            clearTimeout(timer);
        }
    };
    
    window.dealRobot = robot;
}());
