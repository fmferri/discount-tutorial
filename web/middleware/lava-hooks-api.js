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
import { request, gql, GraphQLClient } from "graphql-request";

export default function applyLavaHooksApiEndpoints(app) {
  app.post("/api/lv/cartupdate", async (req, res) => {
    try {
      console.log("WEBOOK REQUEST CARTUPDATE ARRIVATA");
      console.log("BODY", req.body);
      // console.log("HEADER", req.headers);
      // console.log("PARAMS", req.params);
      const customer = getCustomerInfo(req.body.id)
        .then((data) => {
          console.log("SUCCESS CUSTOMER", JSON.stringify(data, undefined, 2));
          const updatedCustomer = updateCustomerInfo(data).then(
            (updatedCustomer) => {
              console.log("UPDATED CUSTOMER", updatedCustomer);
              const updatedCustomer2 = getCustomerInfo(req.body.id).then(
                (updatedCustomer2) => {
                  console.log("UPDATED CUSTOMER2", updatedCustomer2);
                }
              );
            }
          );
          return data;
        })
        .catch((err) => {
          console.log("ERROR", err);
        });

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

const getCustomerInfo = async (id) => {
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
      	id
        firstName
        lastName
        acceptsMarketing
        email
        phone
        createdAt
        updatedAt
        note
        verifiedEmail
        validEmailAddress
        tags
        lifetimeDuration
      }
    }
  `;
  console.log("QUERY", query);
  const client = new GraphQLClient(endpoint, {
    headers: {
      "X-Shopify-Access-Token": process.env.ADMIN_API_ACCESS_TOKEN,
    },
  });
  return client.request(query, variables);
};

const updateCustomerInfo = async (customer) => {
  customer = JSON.parse(JSON.stringify(customer)).customer;
  customer.tags = "SILVER-50";
  console.log("TESTING updateCustomerInfo", customer);
  console.log("CUSTOMER ID", customer.id);
  // id = customer.customer.id;
  const endpoint =
    "https://mdgb-dev-store.myshopify.com/admin/api/2022-07/graphql.json";

  const mutation = gql`
    mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
          tags
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
      id: customer.id,
      tags: customer.tags,
    },
  };
  const client = new GraphQLClient(endpoint, {
    headers: {
      "X-Shopify-Access-Token": process.env.ADMIN_API_ACCESS_TOKEN,
    },
  });
  return client
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
