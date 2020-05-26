const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const prefix = config.prefix;

const cocoSsd = require("@tensorflow-models/coco-ssd");
const sharp = require("sharp");
const tf = require("@tensorflow/tfjs-node");
const axios = require("axios");

var currentPrediction = "havent seen any images yet";
var model;

const loadModel = async () => {
  model = await cocoSsd.load();
}

const predictCats = async (imgUrl, message) => {
  let extension = imgUrl.slice(-4).toLowerCase();
  if (extension == ".png" || extension == ".jpg") {
    let imgResponse = await axios({url: imgUrl, responseType: "arraybuffer"});
    let imgBuffer = Buffer.from(imgResponse.data, "binary");
    let img = sharp(imgBuffer)
      .removeAlpha()
      .toBuffer()
      .then(async (data) => {
        data = tf.node.decodeImage(data);
        let prediction = await model.detect(data)
        console.log(prediction);
        currentPrediction = prediction.length ? prediction[0].class : "unsure";
        for (let i = 0; i < prediction.length; i++){
          if (prediction[i].class == "cat") {
            message.channel.send("roddy");
            break;
          }
        }
      })
      .catch((err) => console.log(err)
    );
  };
};

client.once("ready", () => {
  loadModel();
  console.log("Ready!");
});

client.login(config.token);

client.on("message", message => {
  if (message.attachments.size > 0) {
    for (let i=0; i<message.attachments.size; i++) {
      let id = message.attachments.keyArray()[i];
      let image = message.attachments.get(id);
      predictCats(image.url, message);
    }
  } else if (message.content.length > 0) {
    let text = message.content.split(" ");
    for (let i=0; i<text.length; i++) {
      let extension = text[i].slice(-4).toLowerCase();
      if (extension == ".png" || extension == ".jpg") {
        predictCats(text[i], message);
      }
    }
  }
  if (message.content === `${prefix}guess`) {
    console.log("sending")
    message.channel.send(currentPrediction);
  }
});
