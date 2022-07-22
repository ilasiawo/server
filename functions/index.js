const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());

const checksumLib = require("./checksum.js");

// PAYTM CONFIGURATION
const PaytmConfig = {
  mid: "zRbTyU57088466140623",
  key: "kGRzsHrR7ZwT9C3p",
  website: "WEBSTAGING",
};

const txnUrl = "https://securegw-stage.paytm.in/order/process"; // for staging

const callbackURL = "http://10.0.2.2:5000/weekend-story/us-central1/customFunctions/paymentReceipt";

// CORS ACCESS CONTROL
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post("/payment", (req, res) => {
  const paymentData = req.body;
  const params = {};
  params["MID"] = PaytmConfig.mid;
  params["WEBSITE"] = PaytmConfig.website;
  params["CHANNEL_ID"] = "WEB";
  params["INDUSTRY_TYPE_ID"] = "Retail";
  params["ORDER_ID"] = paymentData.orderID;
  params["CUST_ID"] = paymentData.custID;
  params["TXN_AMOUNT"] = paymentData.amount;
  params["CALLBACK_URL"] = callbackURL;
  params["EMAIL"] = paymentData.custEmail;
  params["MOBILE_NO"] = paymentData.custPhone;

  checksumLib.genchecksum(params, PaytmConfig.key, (err, checksum) => {
    if (err) {
      console.log("Error: " + e);// eslint-disable-line
    }

    let formFields = "";
    for (const x in params) {// eslint-disable-line
      formFields +=
        "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
    }
    formFields +=
      "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

    res.writeHead(200, {"Content-Type": "text/html"});
    res.write(
        "<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method=\"post\" action=\"" +
        txnUrl +
        "\" name=\"f1\">" +
        formFields +
        "</form><script type=\"text/javascript\">document.f1.submit();</script></body></html>"
    );
    res.end();
  });
});

app.post("/paymentReceipt", (req, res) => {
  const responseData = req.body;
  const checksumhash = responseData.CHECKSUMHASH;
  const result = checksumLib.verifychecksum(
      responseData,
      PaytmConfig.key,
      checksumhash
  );
  if (result) {
    return res.send({
      status: 0,
      data: responseData,
    });
  } else {
    return res.send({
      status: 1,
      data: responseData,
    });
  }
});

exports.customFunctions = functions.https.onRequest(app);
