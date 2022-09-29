/*
  The custom REST API to support the app frontend.
  Handlers combine application data from qr-codes-db.js with helpers to merge the Shopify GraphQL Admin API data.
  The Shop is the Shop that the current user belongs to. For example, the shop that is using the app.
  This information is retrieved from the Authorization header, which is decoded from the request.
  The authorization header is added by App Bridge in the frontend code.
*/
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import CryptoJS from "crypto-js";

//TODO key and iv to be set in configuration or somewhere they are available from JS and from RS

export default function testEndpointApi(app) {
  app.get("/test/lv/testendpoint", async (req, res) => {
    try {
      console.log("testEndpointApi REQUEST CARTUPDATE ARRIVATA");
      res.header("Access-Control-Allow-Origin", "*");
      res.send(JSON.stringify({ data: "ciao" }));
      res.end();
    } catch (error) {
      console.log("ERROR in testEndpointApi", error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/lv/config", async (req, res) => {
    configRespone = {};
    res.send(configResponse);
  });
}

async function checkForDiscount(data) {
  const response = {
    statusDiscount: "OK",
    attributeKey: "volume_code",
    attributeValue: "20::" + data.id, // replace with something like <userId>-<value> possibly encoded
  };
  return JSON.stringify(response);
}

function encrypt(text, key, iv) {
  let ciphertext = CryptoJS.AES.encrypt(text, key, { iv: iv });
  // console.log("ciphertextString: ", ciphertext.toString());
  return ciphertext.toString();
}
