(function () {
    function withdrawAll(coin) {
        okcoinUtility.getMyOpenEntrusts(coin, function(entrusts) {
            for (var x in entrusts) {
                var entrust = entrusts[x];
                var id = entrust.id, cny = entrust.cnyPrice, vol = entrust.entrustVolume;
                okcoinUtility.cancelEntrust(entrust.id, coin, function (data) {
                    console.info('entrust: '+id+' withdrawn. cny:'+cny+', vol:'+vol);
                });
            }
        });
    }
    
    function buyAll(coin, price, pwd) {
        okcoinUtility.getAccountInfo(function(account) {
            var vol = account.cnyAvl / price;
            okcoinUtility.submitEntrust(vol, price, pwd, 'buy', coin, function(data) {
                console.info('buy entrust submit: '+new Date.toString()+', cny:'+price+', vol:'+vol+', coin:'+coin);
            });
        });
    }
    
    function sellAll(coin, price, pwd) {
        okcoinUtility.getAccountInfo(function(account) {
            var vol = account[coin+'Avl'];
            okcoinUtility.submitEntrust(vol, price, pwd, 'sell', coin, function(data) {
                console.info('sell entrust submit: '+new Date.toString()+', cny:'+price+', vol:'+vol+', coin:'+coin);
            });
        });
    }
    
    function summary(entrusts) {
        var totalPrice = 0;
        var totalVolume = 0;
        for (var x in entrusts) {
            totalPrice += entrusts[x].cnyPrice * entrusts[x].volume;
            totalVolume += entrusts[x].volume;
        }
        return { meanPrice: totalPrice / totalVolume, volume: totalVolume };
    }
    
    var monitor = (function() {
        var t = null;
        return function(coin, open, intv) {
            if (t === null && open) {
                t = setInterval(function() {
                    console.warn("[" + new Date().toDateString()+"]");
                    okcoinUtility.getAccountInfo(function(account) {
                        console.info('avlCNY: ' + account.cnyAvl
                                     + ' avl' + coin + ': ' + account[coin+'Avl']
                                     + ' frzCNY: ' + account.cnyFrz
                                     + ' frz' + coin + ': ' + account[coin+'Frz']);
                    });
                    okcoinUtility.getCurrentData(function(data) {
                        console.info(coin+'Last: ' + data[coin+'Last'] + ' ' + coin + 'Volume: ' + data[coin+'Volume']);
                    });
                    okcoinUtility.getRecentEntrusts(coin, function(buyEnt, sellEnt) {
                        var buyInfo = summary(buyEnt);
                        var sellInfo = summary(sellEnt);
                        console.info('buyVolume: ' + buyInfo.volume.toFixed(3) + ' meanBuyPrice: ' + buyInfo.meanPrice.toFixed(3));
                        console.info('sellVolume: ' + sellInfo.volume.toFixed(3) + ' meanSellPrice: ' + sellInfo.meanPrice.toFixed(3));
                    });
                }, intv);
                if (t) {
                    console.info("monitor begin: coin="+coin+" interval="+intv);
                }
            } else if (t !== null && !open) {
                clearInterval(t);
                console.info("monitor stop");
                t = null;
            }
        };
    }());
        
    window.chaodi = {
        monitor: monitor,
        withdrawAll: withdrawAll,
        buyAll: buyAll,
        sellAll: sellAll
    };
}());