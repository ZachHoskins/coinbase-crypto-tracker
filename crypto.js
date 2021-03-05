const CBP = require("coinbase-pro");
const fs = require("fs");
const chalk = require("chalk");
const { config } = require("process");
const WEBSOCKET = "wss://ws-feed.pro.coinbase.com";

const apiJSON = fs.readFileSync("./api.json");
const API = JSON.parse(apiJSON);

let cryptoJSON = fs.readFileSync("./crypto.json");
let crypto = JSON.parse(cryptoJSON);
let cryptoArray = [];

crypto.forEach((crypto) => {
  cryptoArray.push(crypto.usdPair);
});

const passphrase = API.PASSPHRASE;
const key = API.KEY;
const secret = API.SECRET;

const websocket = new CBP.WebsocketClient(
  cryptoArray,
  WEBSOCKET,
  {
    key,
    secret,
    passphrase,
  },
  { channels: ["ticker"] }
);

websocket.on("message", (data) => {
  if (data.type === "ticker") {
    crypto.forEach((coin) => {
      if (data.product_id === coin.usdPair) {
        coin.bestAsk = data.best_ask;
        coin.bestBid = data.best_bid;
        coin.low_24h = data.low_24h;
        coin.high_24h = data.high_24h;
        coin.average_24h = ((Number(data.high_24h) + Number(data.low_24h)) / 2).toFixed(4);
        coin.percentChange_average_24h = ((data.best_ask / coin.average_24h - 1) * 100).toFixed(2);
      }
    });

    console.clear();

    console.log(chalk.white.underline("CURRENT COINBASE PRICES:"));
    console.log("");
    crypto.forEach(coin => {
      if(coin.enabled) {
        if(coin.percentChange_average_24h > 0){
          console.log(chalk.green(`${coin.name}`));
          console.log(chalk` {green [${coin.ticker}]  Current: ${coin.bestAsk}  Average 24h: ${coin.average_24h}  Percent Change (24h): ${coin.percentChange_average_24h}%}`);
        } else {
          console.log(chalk.red(`${coin.name}`));
          console.log(chalk` {red [${coin.ticker}]  Current: ${coin.bestAsk}  Average 24h: ${coin.average_24h}  Percent Change (24h): ${coin.percentChange_average_24h}%}`);
        }
      }
    })
  }
});
websocket.on("error", (err) => {
  console.log(err);
});
websocket.on("close", () => {});
