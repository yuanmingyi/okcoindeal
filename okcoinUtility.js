// namespace: okcoinUtility
(function () {
    var debug = false;
    var baseUrl = "https://www.okcoin.com";
    var symbols = {
        btc: 0,
        ltc: 1
    };
    
    // compose request url by add random query parameter
    function composeRequestUrl(url) {
        if (!url || typeof (url) !== 'string') {
            return baseUrl;
        }
        if (url.indexOf('://') === -1) {
            url = baseUrl + url;
        }
        if (url.indexOf('?') === -1) {
            url = url + '?';
        } else {
            url = url + '&';
        }
        return url + 'random=' + Math.round(Math.random() * 100);
    }
    
    // get the current price
    //      d.btcLast;      // the latest deal price of BTC
    //      d.btcVolume;    // amount of the deal of BTC for the last 24 hours
    //      d.buy;
    //      d.high;
    //      d.last;
    //      d.low;
    //      d.ltcLast;      // the latest deal price of LTC
    //      d.ltcVolume;    // amount of the deal of LTC for the last 24 hours
    //      d.sell;
    //      d.vol;
    function getCurrentData(func) {
        var url = composeRequestUrl("/ticker.do");
        jQuery.post(url, null, function (data) {
            var d = jQuery.parseJSON(data);
            func(d);
        });
    }
    
    // get recent deal info
    // the return data is passed to the given callback func
    // the data is a array composed of 60 latest deals. the first elememt is the latest and the last is earliest.
    // each deal contains 3 property: 
    //      timeStamp is a string representing the occured time of the deal (use new Date(timeStamp) or date.setTime(timeStamp) to convert it to Date type)
    //      cnyPrice is a float number representing the price in CNY of the deal
    //      volume is a float number representing the volume of the deal
    function getRecentDeals(coin, func) {
        var url = composeRequestUrl("/marketRecentDealRefresh.do?symbol=" + symbols[coin]);
        if (debug) {
            console.info("getRecentDeals(coin,func) url:" + url);
        }
        jQuery.get(url, null, function (data) {
            var records = [];
            var trs = jQuery(data).children('tbody').children('tr');
            var date = new Date();
            trs.each(function () {
                var tds = jQuery(this).children('td');
                var time = tds[0].innerText.trim().split(':');
                date.setHours(time[0]);
                date.setMinutes(time[1]);
                date.setSeconds(time[2]);
                records.push({
                    timeStamp: date.getTime(),
                    cnyPrice: parseFloat(tds[1].innerText.trim().slice(1)),
                    volume: parseFloat(tds[2].innerText.trim().slice(1))
                });
            });
            func(records);
        });
    }
    
    // get recent entrust info
    // the data is a array composed of latest 60 buy entrusts and 60 sell entrusts. the first elememt is the latest and the last is earliest.
    // each entrust contains 2 property:     
    //      cnyPrice is a float number representing the price in CNY of the entrust
    //      volume is a float number representing the volume of the entrust
    function getRecentEntrusts(coin, func) {
        var url = composeRequestUrl("/marketEntrustRefresh.do?symbol=" + symbols[coin]);
        if (debug) {
            console.info("getRecentEntrusts(coin,func) url:" + url);
        }
        var addRecord = function(arr) {
            return function (ind, obj) {
                var tds = jQuery(obj).children('td');
                arr.push({
                    cnyPrice: parseFloat(tds[1].innerText.trim().slice(1)),
                    volume: parseFloat(tds[2].innerText.trim().slice(1))
                });
            };
        };
        jQuery.get(url, null, function (data) {
            var buyRecords = [], sellRecords = [];
            var tables = jQuery(data).children('table').children('tbody');
            var buyTrs = tables.first().children('tr');
            var sellTrs = tables.last().children('tr');
            buyTrs.each(addRecord(buyRecords));
            sellTrs.each(addRecord(sellRecords));
            func(buyRecords, sellRecords);
        });
    }

    // get both entrust & deal info
//    function getRecentData(coin, func) {
//        var url = composeRequestUrl("/indexDepth.do?symbol=" + symbols[coin]);
//        jQuery.get(url, null, function (data) {
//            func(data);
//        });
//    }

    // get history data
    // coin: 'btc' or 'ltc'
    // intvType: 'd' for 1day or 'm' for 5min
    // return data is passed to the given callback func
    // the data is a array composed of history deal records. the first elememt is the earliest and the last is latest.
    // each deal is a array with data summarizing the timespan (1day or 5min)
    //      1st element is the time for generating the data, (use new Date(timeStamp) or date.setTime(timeStamp) to convert it to Date type)
    //      2nd element is the open price of the timespan
    //  `   3rd element is the highest price of the timespan
    //      4th element is the lowest price of the timespan
    //      5th element is the close price of the timespan
    //      6th element is the volume of the timespan    
    function getHistoryData(coin, intvType, func) {
        var url = baseUrl + "/klineData.do?marketFrom=" + (coin === 'btc' ? 0 : 3) + "&type=" + (intvType === 'd' ? 3 : 1);
        if (debug) {
            console.info("getHistoryData(coin,intvType,func) url:" + url);
        }
        jQuery.getJSON(url, func);
    }
    
    // submit a entrust
    function submitEntrust(volume, cnyPrice, pwd, entrustType, coin, func) {
        var param = {
            tradeAmount: volume,
            tradeCnyPrice: cnyPrice,
            tradePwd: pwd,
            symbol: symbols[coin]
        }, url = "";
    
        if (entrustType === 'buy') {
            url = composeRequestUrl("/trade/buyBtcSubmit.do");
        } else {
            url = composeRequestUrl("/trade/sellBtcSubmit.do");
        }
        
        jQuery.post(url, param, function (data) {
            var result = jQuery.parseJSON(data);
            if (result !== null) {
                switch (result.resultCode) {
                case 0:
                    console.info("Submit entrust successfully");
                    break;
                case -1:
                    console.error("Submit entrust failed: least trade amount: 0.1");
                    break;
                case -2:
                    console.error("Submit entrust failed: entrust password incorrect! left " + result.errorNum + " tries");
                    break;
                case -3:
                    console.error("Submit entrust failed: price cannot be 0");
                    break;
                case -4:
                    console.error("Submit entrust failed: not enough money");
                    break;
                case -5:
                    console.error("Submit entrust failed: entrust password incorrect for five times. Please try 2 hours later");
                    break;
                case -6:
                    console.error("Submit entrust failed: your price is too far away from acutal deal price.");
                    break;
                default:
                    console.error("Submit entrust failed: unknown reason.");
                    break;
                }
            }
            func(result);
        });
    }
    
    // withdraw the entrust
    function cancelEntrust(entrustId, coin, func) {
        var url = composeRequestUrl("/trade/cancelEntrust.do");
        var param = {entrustId: entrustId, symbol: symbols[coin]};
        jQuery.post(url, param, function (data) {
            if (data === 0) {
                console.info("entrust " + entrustId + " withdrawn successfully");
            }
            func(data);
        });
    }
    
    // get open entrusts
    function getMyOpenEntrusts(coin, func) {
        var url = baseUrl + "/entrust.do?status=0&symbol=" + symbols[coin];
        if (debug) {
            console.info("getMyOpenEntrusts(coin,func) url:" + url);
        }
        jQuery.get(url, null, function (data) {
            var entrusts = [];
            var trs = jQuery(data).find("td[id^='entrustStatus']").parent('tr');
            trs.each(function (ind) {
                var tds = jQuery(this).children('td');
                entrusts.push({
                    id: tds[7].id.slice(13),
                    coin: coin,
                    timeStamp: new Date(tds[0].innerText.trim()),
                    entrustType: (tds[1].innerText.trim() === '卖出' ? 'sell' : 'buy'),
                    entrustVolume: parseFloat(tds[2].innerText.trim().slice(1)),
                    cnyPrice: parseFloat(tds[3].innerText.trim().slice(1)),
                    dealVolume: parseFloat(tds[4].innerText.trim().slice(1)),
                    dealMoney: parseFloat(tds[5].innerText.trim().slice(1)),
                    pendingVolume: parseFloat(tds[6].innerText.trim().slice(1))
                });
            });
            func(entrusts);
        });
    }
    
    // get account info
    // xxxAvl: available xxx (can be used to create a entrust)
    // xxxFrz: frozen xxx (in a pending entrust)
    function getAccountInfo(func) {
        jQuery.get(baseUrl, null, function (data) {
            var contentDiv = jQuery(data).find('.accountinfo1');
            var list = contentDiv.children('div.nav2-up1').children('ul').children('li.text').children('span');
            var account = {
                cnyAvl: parseFloat(list[1].innerText),
                btcAvl: parseFloat(list[3].innerText),
                ltcAvl: parseFloat(list[5].innerText),
                cnyFrz: parseFloat(list[7].innerText),
                btcFrz: parseFloat(list[9].innerText),
                ltcFrz: parseFloat(list[11].innerText),
                cnyTotal: parseFloat(contentDiv.children('div.nav2-center').children('ul').children('li').children('span')[1].innerText)
            };
            func(account);
        });
    }

    // login user with weibo account
    function login() {
        window.open(baseUrl + '/weibo/call.do?url=' + baseUrl, 'new', 'height=450,,innerHeight=450,width=550,innerWidth=550,top=200,left=200,toolbar=no,menubar=no,scrollbars=auto,resizeable=no,location=no,status=no');
    }
    
    window.okcoinUtility = {
        getAccountInfo: getAccountInfo,
        getCurrentData: getCurrentData,
        getHistoryData: getHistoryData,
        getMyOpenEntrusts: getMyOpenEntrusts,
        getRecentEntrusts: getRecentEntrusts,
        getRecentDeals: getRecentDeals,
        submitEntrust: submitEntrust,
        cancelEntrust: cancelEntrust,
        login: login
    };
}());