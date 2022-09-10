/*
  The custom REST API to support the app frontend.
  Handlers combine application data from qr-codes-db.js with helpers to merge the Shopify GraphQL Admin API data.
  The Shop is the Shop that the current user belongs to. For example, the shop that is using the app.
  This information is retrieved from the Authorization header, which is decoded from the request.
  The authorization header is added by App Bridge in the frontend code.
*/

import { Shopify } from "@shopify/shopify-api";

export default function applyLavaHooksApiEndpoints(app) {
  app.post("/api/lv/cartupdate", async (req, res) => {
    try {
      console.log("WEBOOK REQUEST CARTUPDATE ARRIVATA");
      console.log(req.body);
      res.send("SUCCESSSSSS!!!!");
      res.end();
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
}
