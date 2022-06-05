const ccxt = require('ccxt')

;(async () => {
    let binance     = new ccxt.binance();
    let gateio      = new ccxt.gateio();
    let bitfinex    = new ccxt.bitfinex();
    let bitmex      = new ccxt.bitmex();
    let ftx         = new ccxt.ftx();
    let kraken      = new ccxt.kraken();
    let kucoin      = new ccxt.kucoin();
    let huobi       = new ccxt.huobi();

    const changes = ["binance", "gateio", "bitfinex", "bitmex", "ftx", "kraken", "kucoin", "huobi"];

    let markets = await binance.loadMarkets()

    let arrMarkets = [];

    for (let item in markets) {
        arrMarkets.push(item);
    }

    for (let i = 0; i < arrMarkets.length; i++) {
        const currentPair = arrMarkets[i];
        let fulfilled = [];

        const result = await Promise.allSettled([
            binance.fetchOrderBook(currentPair),
            gateio.fetchOrderBook(currentPair),
            bitfinex.fetchOrderBook(currentPair),
            bitmex.fetchOrderBook(currentPair),
            ftx.fetchOrderBook(currentPair),
            kraken.fetchOrderBook(currentPair),
            kucoin.fetchOrderBook(currentPair),
            huobi.fetchOrderBook(currentPair)
        ]);

        result.forEach((item, i, arr) => {
            if (item.status == 'fulfilled') {
                fulfilled[changes[i]] = item;
            }
        })

        const countFoundExchanges = Object.keys(fulfilled).length;

        if (countFoundExchanges >= 2) {
            let bids = [],
                asks = [],
                bestBuy,
                bestSell;

            for (let item in fulfilled) {
                try {
                    bids[item] = fulfilled[item].value.bids[0][0];
                    asks[item] = fulfilled[item].value.asks[0][0];
                } catch(e) {}
            }

            for (let item in bids) {
                if (!bestBuy) {
                    bestBuy = {
                        exchange: item,
                        price: bids[item]
                    }
                } else if (bids[item] < bestBuy.price) {
                    bestBuy = {
                        exchange: item,
                        price: bids[item]
                    }
                }
            }

            for (let item in asks) {
                if (!bestSell) {
                    bestSell = {
                        exchange: item,
                        price: asks[item]
                    }
                } else if (asks[item] > bestSell.price) {
                    bestSell = {
                        exchange: item,
                        price: asks[item]
                    }
                }
            }

            try {
                if (bestBuy.exchange != bestSell.exchange) {
                    const spread = (bestSell.price / bestBuy.price - 1) * 100;

                    if (spread >= 4) {
                        console.log(`Покупай ${currentPair} на бирже ${bestBuy.exchange} за ${bestBuy.price}. Продавай на бирже ${bestSell.exchange} за ${bestSell.price}. Прибыль ${spread}%`);
                    }
                }
            }
            catch(e) {}
        }
    }
})();