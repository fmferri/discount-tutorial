/*
  The custom REST API to support the app frontend.
  Handlers combine application data from qr-codes-db.js with helpers to merge the Shopify GraphQL Admin API data.
  The Shop is the Shop that the current user belongs to. For example, the shop that is using the app.
  This information is retrieved from the Authorization header, which is decoded from the request.
  The authorization header is added by App Bridge in the frontend code.
*/
import * as dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { request, gql, GraphQLClient } from "graphql-request";

export default function applyLavaHooksApiEndpoints(app) {
  app.post("/api/lv/cartupdate", async (req, res) => {
    try {
      console.log("WEBOOK REQUEST CARTUPDATE ARRIVATA");
      console.log("BODY", req.body);
      // console.log("HEADER", req.headers);
      // console.log("PARAMS", req.params);
      const customer = await getUserInfo(req.body.id)
        .then((data) => {
          console.log("SUCCESS CUSTOMER", JSON.stringify(data, undefined, 2));
          return data;
        })
        .catch((err) => {
          console.log("ERROR", err);
        });
      console.log("RETRIEVED CUSTOMER", customer);
      // updateUserInfo(req.body.id);
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

const getUserInfo = async (id) => {
  console.log("TESTING getUserInfo");
  id = "gid://shopify/Customer/" + id;
  const endpoint =
    "https://mdgb-dev-store.myshopify.com/admin/api/2022-07/graphql.json";
  const variables = {};
  const query =
    gql`
    {
      customer(id: "` +
    id +
    `") {
      createdAt
      displayName
      email
      firstName
      id
      lastName
      lifetimeDuration
      note
      numberOfOrders
      state
      tags
      updatedAt
      }
    }
  `;
  console.log("QUERY", query);
  const client = new GraphQLClient(endpoint, {
    headers: {
      "X-Shopify-Access-Token": "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",
    },
  });
  return client.request(query, variables);
};

const updateUserInfo = async (id) => {
  console.log("TESTING updateUserInfo");
  id = "gid://shopify/Customer/" + id;
  const endpoint =
    "https://mdgb-dev-store.myshopify.com/admin/api/2022-07/graphql.json";

  const mutation = gql`
    mutation customerUpdate($input: CustomerInput) {
      customerUpdate(input: $input) {
        customer {
          tags
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  console.log("mutation", mutation);
  const variables = {
    input: {
      id: id,
      tags: ["SILVER-50"],
    },
  };
  const client = new GraphQLClient(endpoint, {
    headers: {
      "X-Shopify-Access-Token": "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",
    },
  });
  client
    .request(mutation, variables)
    .then((data) => {
      console.log("CUSTOMER Updated", JSON.stringify(data, undefined, 2));
      return data;
    })
    .catch((err) => {
      console.log("ERROR", err);
    });
};

async function checkForDiscount(data) {
  const response = { statusDiscount: "OK" };
  return JSON.stringify(response);
}
