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
import _ from "lodash";

//TODO key and iv to be set in configuration or somewhere they are available from JS and from RS

export default function applyLavaHooksApiEndpoints(app) {
  app.post("/api/lv/cartupdate", async (req, res) => {
    try {
      // console.log("WEBOOK REQUEST CARTUPDATE ARRIVATA");
      // console.log("BODY", req.body);
      const customerInput = req.body;
      let discountResponse = JSON.parse(await checkForDiscount(req.body, res));
      const key = CryptoJS.SHA256("gid://shopify/Customer/" + req.body.id);
      const iv = CryptoJS.enc.Base64.parse("AAAAAAAAAAAAAAAAAAAAAA==");
      const discountResponseEncrypted = encrypt(
        discountResponse.attributeValue,
        key,
        iv
      );
      discountResponse["attributeValue"] = discountResponseEncrypted;
      res.header("Access-Control-Allow-Origin");

      // console.log("--- discountResponse", discountResponse);
      res.send(JSON.stringify(discountResponse));
      res.end();
    } catch (error) {
      console.log("ERROR in applyLavaHooksApiEndpoints", error);
      res.status(418).send(error.toString());
      res.end();
    }
  });

  app.post("/api/lv/config", async (req, res) => {
    configRespone = {};
    res.send(configResponse);
  });
}

async function checkForDiscount(data, res) {
  console.log("--- checkForDiscount", data);
  /**
   * STEP 1 CALL LAVA getMembership API.
   */
  const domain = "https://realmadrid-staging-membership.lava.ai";
  const endPointMembership = "/v1/memberships/";
  const AuthStr = "Bearer ".concat(process.env.LAVA_TOKEN);
  const urlMembership = domain + endPointMembership + data.email;
  const membershipResponse = await axios
    .get(urlMembership, {
      params: { stored_only: false },
      headers: { Authorization: AuthStr },
    })
    .then((response) => {
      // console.log("--- first LAVA response", response);
      return response.data;
    })
    .catch((error) => {
      console.error("--- ERROR CALL", error.response);
      throw new Error(
        JSON.stringify({
          status: error.response.status,
          error: error.response.statusText.toString(),
        })
      );
    });
  // console.log("--- membershipResponse", membershipResponse);
  const balancesIDs = [];
  if (!membershipResponse?.balances) {
    // return JSON.stringify({});
    throw new Exception("BROKEN");
  }
  const balances = _.filter(membershipResponse?.balances, (balance) => {
    if (
      balance.promotion.type === "percentage" &&
      balance.promotion.applies_to_transaction == true
    ) {
      balancesIDs.push(balance.promotion.id.toString());
      return true;
    }
    return false;
  });

  /**
   * STEP 2 CALL LAVA reward API.
   */

  const endPointReward = "/v1/reward";
  const urlReward = domain + endPointReward;
  const rewardResponse = await axios
    .get(urlReward, {
      headers: { Authorization: AuthStr },
    })
    .then((response) => {
      // console.log("--- first LAVA response", response);
      return response.data;
    })
    .catch((error) => {
      console.error("--- ERROR", error);
    });
  console.log("--- rewardResponse", rewardResponse);
  const rewards = _.filter(rewardResponse, (reward) => {
    const condition =
      reward.params.scope === "txn" &&
      reward.params.action === "percent_off" &&
      balancesIDs.includes(reward.id.toString());
    console.log("--- condition", condition);
    return condition;
  });

  /**
   * STEP 3 GET THE ONE WITH HIGHEST AMOUNT
   */
  const bestReward = _.orderBy(rewards, ["params.amount"], ["desc"])[0];
  console.log("--- bestReward", bestReward);

  const extractedResponse = {
    statusDiscount: "OK",
    attributeKey: "volume_code",
    attributeValue: bestReward.params.amount + "::" + data.id, // replace with something like <userId>-<value> possibly encoded
  };
  console.log("--- extractedResponse", extractedResponse);
  return JSON.stringify(extractedResponse);
}

function encrypt(text, key, iv) {
  let ciphertext = CryptoJS.AES.encrypt(text, key, { iv: iv });
  // console.log("ciphertextString: ", ciphertext.toString());
  return ciphertext.toString();
}
