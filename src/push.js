const superagent = require("superagent");
const { logger } = require("./logger");

let WX_PUSHER_UID = process.env.WX_PUSHER_UID;
let WX_PUSHER_APP_TOKEN = process.env.WX_PUSHER_APP_TOKEN;

let telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
let telegramBotId = process.env.TELEGRAM_CHAT_ID;

// 新增两个 PushPlus Token
let pushPlusToken1 = process.env.PUSH_PLUS_TOKEN1;
let pushPlusToken2 = process.env.PUSH_PLUS_TOKEN2;

const pushTelegramBot = (title, desp) => {
  if (!(telegramBotToken && telegramBotId)) {
    return;
  }
  const data = {
    chat_id: telegramBotId,
    text: `${title}\n\n${desp}`,
  };
  superagent
    .post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`)
    .type("form")
    .send(data)
    .timeout(3000)
    .then((res) => {
      if (res.body?.ok) {
        logger.info("TelegramBot推送成功");
      } else {
        logger.error(`TelegramBot推送失败:${JSON.stringify(res.body)}`);
      }
    })
    .catch((err) => {
      logger.error(`TelegramBot推送失败:${err}`);
    });
};

const pushWxPusher = (title, desp) => {
  if (!(WX_PUSHER_APP_TOKEN && WX_PUSHER_UID)) {
    return;
  }
  const data = {
    appToken: WX_PUSHER_APP_TOKEN,
    contentType: 1,
    summary: title,
    content: desp,
    uids: [WX_PUSHER_UID],
  };
  superagent
    .post("https://wxpusher.zjiecode.com/api/send/message")
    .send(data)
    .timeout(3000)
    .end((err, res) => {
      if (err) {
        logger.error(`wxPusher推送失败:${JSON.stringify(err)}`);
        return;
      }
      const json = JSON.parse(res.text);
      if (json.data[0].code !== 1000) {
        logger.error(`wxPusher推送失败:${JSON.stringify(json)}`);
      } else {
        logger.info("wxPusher推送成功");
      }
    });
};

const pushPushPlus = (title, desp) => {
  // 定义一个函数来推送单个 token
  const pushToToken = (token) => {
    if (!token) {
      return;
    }
    const data = {
      token: token,
      title: title,
      content: desp,
      template: "html", // 可选：json/html，默认是html
    };
    superagent
      .post("https://www.pushplus.plus/send")
      .type("form")
      .send(data)
      .timeout(3000)
      .then((res) => {
        if (res.body?.code === 200) {
          logger.info(`PushPlus(${token})推送成功`);
        } else {
          logger.error(`PushPlus(${token})推送失败:${JSON.stringify(res.body)}`);
        }
      })
      .catch((err) => {
        logger.error(`PushPlus(${token})推送失败:${err}`);
      });
  };

  // 分别推送两个 token
  pushToToken(pushPlusToken1);
  pushToToken(pushPlusToken2);
};

const push = (title, desp) => {
  pushWxPusher(title, desp);
  pushTelegramBot(title, desp);
  pushPushPlus(title, desp);
};

exports.push = push;
