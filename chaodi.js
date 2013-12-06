(function () {
    function withdrawAll(coin, entrusts) {
        for (var x in entrusts) {
            var entrust = entrusts[x];
            var id = entrust.id, cny = entrust.cnyPrice, vol = entrust.entrustVolume;
            okcoinUtility.cancelEntrust(entrust.id, coin, function (data) {
                console.info('entrust: '+id+' withdrawn. cny:'+cny+', vol:'+vol);
            });
        }
    }
    
    function buyAll(coin, account, price, pwd) {
        var vol = account.cnyAvl / price;
        if (vol >= 0.1) {
            okcoinUtility.submitEntrust(vol, price, pwd, 'buy', coin, function(data) {
                console.info('buy entrust submit: '+new Date().toString()+', cny:'+price+', vol:'+vol+', coin:'+coin);
            });
        }
    }
    
    function sellAll(coin, account, price, pwd) {
        var vol = account[coin+'Avl'];
        if (vol >= 0.1) {
            okcoinUtility.submitEntrust(vol, price, pwd, 'sell', coin, function(data) {
                console.info('sell entrust submit: '+new Date().toString()+', cny:'+price+', vol:'+vol+', coin:'+coin);
            });
        }
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
    
    var getParameters = null;
    
    function getEntrustsByType(entrusts, type) {
        var entInType = [];
        for (var x in entrusts) {
            if (entrusts[x].entrustType === type) {
                entInType.push(entrusts[x]);
            }
        }
        return entInType;
    }
    
    function RunAutoDeal(coin, account, buyEnt, sellEnt) {
        params = getParameters();
        if (params) {
            if (params.buyPrice && buyEnt[0].cnyPrice < params.buyPrice) {
                buyAll(coin, account, buyEnt[0].cnyPrice+0.1, params.pwd);
            }
            if (params.sellPrice && sellEnt[0].cnyPrice > params.sellPrice) {
                sellAll(coin, account, sellEnt[0].cnyPrice-0.1, params.pwd);
            }
        }
    }
    
    var isAuto = false;
    function setAuto(auto, getParametersFunc) {
        isAuto = auto;
        getParameters = getParametersFunc;
    }
    
    var monitor = (function() {
        var t = null;
        
        return function(coin, open, intv) {
            if (t === null && open) {
                t = setInterval(function() {
                    console.warn("[" + new Date().toDateString()+"]");                    
                    okcoinUtility.getCurrentData(function(data) {
                        console.info(coin+'Last: ' + data[coin+'Last'] + ' ' + coin + 'Volume: ' + data[coin+'Volume']);
                        okcoinUtility.getAccountInfo(function(account) {
                            console.info('avlCNY: ' + account.cnyAvl
                                         + ' avl' + coin + ': ' + account[coin+'Avl']
                                         + ' frzCNY: ' + account.cnyFrz
                                         + ' frz' + coin + ': ' + account[coin+'Frz']);
                            okcoinUtility.getRecentEntrusts(coin, function(buyEnt, sellEnt) {
                                var buyInfo = summary(buyEnt);
                                var sellInfo = summary(sellEnt);
                                console.info('buyVolume: ' + buyInfo.volume.toFixed(3) + ' meanBuyPrice: ' + buyInfo.meanPrice.toFixed(3));
                                console.info('sellVolume: ' + sellInfo.volume.toFixed(3) + ' meanSellPrice: ' + sellInfo.meanPrice.toFixed(3));
                                console.info('buy1: ' + buyEnt[0].cnyPrice + ' vol: ' + buyEnt[0].volume);
                                console.info('sell1:' + sellEnt[0].cnyPrice + ' vol: ' + sellEnt[0].volume);
                                if (isAuto) {
                                    RunAutoDeal(coin, account, buyEnt, sellEnt);
                                }
                            });
                        });
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
        
        withdrawAll: function(coin) {
            okcoinUtility.getMyOpenEntrusts(coin, function(entrusts) {
                withdrawAll(coin, entrusts);
            });
        },
        
        buyAll: function(coin, price, pwd) {
            okcoinUtility.getAccountInfo(function(account) {
                buyAll(coin, account, price, pwd);
            });
        },
        
        sellAll: function(coin, price, pwd) {
            okcoinUtility.getAccountInfo(function(account) {
                sellAll(coin, account, price, pwd);
            });
        },
        
        setAuto: setAuto
    };
}());