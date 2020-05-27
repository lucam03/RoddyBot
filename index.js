const Discord = require("discord.js");
const _ = require("underscore");
const cocoSsd = require("@tensorflow-models/coco-ssd");
const sharp = require("sharp");
const tf = require("@tensorflow/tfjs-node");
const axios = require("axios");
const config = require("./config.json");

const client = new Discord.Client();
const prefix = config.prefix;

var currentPredictions = {};
var model;
const acceptedFormats = ["jpg", "jpeg", "png", "webp"];

const loadModel = async () => {
  console.log("Loading model...")
  model = await cocoSsd.load();
  console.log("Ready!");
}

const predictCats = async (imgUrl, message) => {
  let extension = imgUrl.split('.').pop().toLowerCase();
  if (acceptedFormats.includes(extension)) {
    let imgResponse = await axios({url: imgUrl, responseType: "arraybuffer"});
    let imgBuffer = Buffer.from(imgResponse.data, "binary");
    let img = sharp(imgBuffer)
      .removeAlpha()
      .toBuffer()
      .then(async (data) => {
        data = tf.node.decodeImage(data);
        let prediction = await model.detect(data);
        console.log("Guess(es) for "+imgUrl+":");
        console.log(prediction);
        allPredictions = _.uniq(_.pluck(prediction, "class"));
        allScores = _.uniq(_.pluck(prediction, "score"));
        currentPredictions[message.channel] = prediction.length ? allPredictions : "unsure";
        if (allPredictions.includes("cat")) {
          message.channel.send("roddy");
        }
      })
      .catch((err) => console.log(err)
    );
  };
};

client.once("ready", () => {
  loadModel();
});

client.login(config.token);

client.on("message", message => {
  if (message.attachments.size) {
    for (let i = 0; i < message.attachments.size; i++) {
      let id = message.attachments.keyArray()[i];
      let image = message.attachments.get(id);
      predictCats(image.url, message);
    }
  } else if (message.content.length) {
    let text = message.content.split(" ");
    for (let i=0; i<text.length; i++) {
      let parts = text[i].split(".");
      let extension = parts.pop().toLowerCase();
      if (acceptedFormats.includes(extension)) {
        predictCats(text[i], message);
      }
    }
  }
  if (message.content.toLowerCase().startsWith(`${prefix}guess`)) {
    console.log("Guessing...")
    message.channel.send(currentPredictions[message.channel] ? currentPredictions[message.channel] : "i havent seen any pictures yet");
  }
});
