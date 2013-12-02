// deal robot
// import okcoinUtility.js
(function () {
    var robot = {};
    var interval = 10000;   // default 10s
    var timer = null;
    var coin = 'ltc';
    var pwd = 'ymy-2008';
    
    function updateData(func) {
        okcoinUtility.getAccountInfo(function (account) {
            okcoinUtility.getCurrentData(function (current) {
                okcoinUtility.getMyOpenEntrusts(coin, function (myEntrusts) {
                    okcoinUtility.getRecentDeals(coin, function (recentDeals) {
                        okcoinUtility.getRecentEntrusts(coin, function (buyRecords, sellRecords) {              
                            func(account, current, myEntrusts, recentDeals, buyRecords, sellRecords);
                        });
                    });
                });
            });            
        });
    }
    
    var lastWeightedPrice = 0;
    var curWeightedPrice = 0;
    var maxPendingTime = 60000;    // 120 seconds
    var lastEntrust = null;
    var entrustDiff = 0.005;         // 0.5% if price difference exceed this ratio, action will be taken
    var volumeRatio = 0.0003;       // 0.03% calculate the weighted price within recent deals which have at least volumeRatio of 24 volume
    
    function calcWeightedPrice(recentDeals, volume24) {
        var weightedPrice = 0, volume = 0, totalPrice = 0, stopVolume = volumeRatio * volume24;
        for (var i = 0; i < recentDeals.length && volume < stopVolume; i++) {
            var deal = recentDeals[i];
            volume += deal.volume;
            totalPrice += deal.cnyPrice * deal.volume;
        }        
        return (volume < stopVolume) ? 0 : totalPrice / volume;
    }
    
    function strategy(account, current, myEntrusts, recentDeals, buyRecords, sellRecords) {
        if (!account || !current || !myEntrusts || !recentDeals) {
            // infomation is not enough
            return;
        }
        console.info('run strategy');
        
        var coinAvailable = account[coin+'Avl'];
        var cnyAvailable = account['cnyAvl'];
        
        // calculate current weighted price from recent deals
        lastWeightedPrice = curWeightedPrice;
        curWeightedPrice = calcWeightedPrice(recentDeals, current[coin+'Volume']);
        if (curWeightedPrice === 0) {
            curWeightedPrice = lastWeightedPrice;
        }
        console.info('current weighted price:'+curWeightedPrice);
        
        if (lastEntrust !== null) {
            for (var x in myEntrusts) {
                var entrust = myEntrusts[x];
                var curTime = new Date();
                if (Math.abs(entrust.timeStamp.getTime() - lastEntrust.timeStamp.getTime()) < 60000
                    && Math.abs(entrust.cnyPrice - lastEntrust.cnyPrice) < 0.01
                    && Math.abs(entrust.entrustVolume - lastEntrust.volume) < 0.001
                    && entrust.entrustType === lastEntrust.type
                    && entrust.coin === lastEntrust.coin) {
                    // make sure the entrust is submit by robot
                    if ((entrust.cnyPrice < curWeightedPrice && entrust.entrustType === 'buy')
                        || (entrust.cnyPrice > curWeightedPrice && entrust.entrustType === 'sell')
                        || (curTime.getTime() - lastEntrust.timeStamp.getTime() > maxPendingTime)) {
                        okcoinUtility.cancelEntrust(entrust.id, coin, function (data) {
                            console.info('entrust: '+entrust.id+' withdrawn. cny:'+entrust.cnyPrice+', vol:'+entrust.entrustVolume);
                        });
                    } else {
                        // wait the entrust to be finished
                        return;
                    }
                }
            }
        }
        
        // buy if the weighted deal price has rised, and sell if the weighted deal price has sinked
        if (lastWeightedPrice === 0) {
            return;
        }
        
        if (curWeightedPrice / lastWeightedPrice > (1 + entrustDiff)) {
            // buy in
            var buyPrice = curWeightedPrice + 0.01;
            var buyVol = cnyAvailable / buyPrice;
            if (buyVol > 0.1) {
                okcoinUtility.submitEntrust(buyVol, buyPrice, pwd, 'buy', coin, function(data) {
                    lastEntrust = {
                        timeStamp: new Date(),
                        cnyPrice: buyPrice,
                        volume: buyVol,
                        type: 'buy',
                        coin: coin
                    };
                    console.info('buy entrust submit: '+lastEntrust.timeStamp.toString()+', cny:'+buyPrice+', vol:'+buyVol+', coin:'+coin);
                });
            }
        } else if (curWeightedPrice / lastWeightedPrice < (1 - entrustDiff)) {
            // sell out
            if (coinAvailable > 0.1) {
                var sellPrice = curWeightedPrice - 0.01;
                okcoinUtility.submitEntrust(coinAvailable, sellPrice, pwd, 'sell', coin, function(data) {
                    lastEntrust = {
                        timeStamp: new Date(),
                        cnyPrice: sellPrice,
                        volume: coinAvailable,
                        type: 'sell',
                        coin: coin
                    };
                    console.info('sell entrust submit: '+lastEntrust.timeStamp.toString()+', cny:'+sellPrice+', vol:'+coinAvailable+', coin:'+coin);
                });
            }
        }
    }
    
    robot.Setup = function(param) {
        if (param.interval) {
            interval = param.interval;
        }
        if (param.coin) {
            coin = param.coin;
        }
        if (param.pwd) {
            pwd = param.pwd;
        }
        if (param.entrustDiff) {
            entrustDiff = param.entrustDiff;
        }
        if (param.volumeRatio) {
            volumeRatio = param.volumeRatio;
        }
        if (param.maxPendingTime) {
            maxPendingTime = param.maxPendingTime;
        }
    };
    
    robot.strategy = strategy;
    
    robot.Start = function() {
        timer = setInterval(updateData, interval, robot.strategy);
    };
    
    robot.Stop = function() {
        if (timer !== null) {
            clearInterval(timer);
        }
    };
    
    window.dealRobot = robot;
}());
