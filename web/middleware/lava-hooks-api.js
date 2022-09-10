/*
  The custom REST API to support the app frontend.
  Handlers combine application data from qr-codes-db.js with helpers to merge the Shopify GraphQL Admin API data.
  The Shop is the Shop that the current user belongs to. For example, the shop that is using the app.
  This information is retrieved from the Authorization header, which is decoded from the request.
  The authorization header is added by App Bridge in the frontend code.
*/

import cors from "cors";

export default function applyLavaHooksApiEndpoints(app) {
  app.post("/api/lv/cartupdate", cors(), async (req, res) => {
    try {
      console.log("WEBOOK REQUEST CARTUPDATE ARRIVATA");
      console.log(req.body);
      const discountResponse = await checkForDiscount(req.body);
      res.header("Access-Control-Allow-Origin");
      res.send(discountResponse);
      res.end();
    } catch (error) {
      console.log("ERROR", error);
      res.status(500).send(error.message);
    }
  });
}

async function checkForDiscount(data) {
  const response = { statusDiscount: "OK" };
  return JSON.stringify(response);
}
