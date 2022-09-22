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
import CryptoJS from "crypto-js";


//TODO key and iv to be set in configuration or somewhere they are available from JS and from RS

const key = CryptoJS.SHA256("solillo");
const plaintext = "20::5424413868081";
const iv = CryptoJS.enc.Base64.parse("AAAAAAAAAAAAAAAAAAAAAA==")
console.log("key: ",key);
console.log("iv: ",iv.toString());

export default function applyLavaHooksApiEndpoints(app) {
  app.post("/api/lv/cartupdate", async (req, res) => {
    try {
      console.log("WEBOOK REQUEST CARTUPDATE ARRIVATA");
      console.log("BODY", req.body);
      // console.log("HEADER", req.headers);
      // console.log("PARAMS", req.params);
      const customerInput = req.body;
      console.log("customerInput", customerInput);
      const customer = getCustomerInfo(customerInput.id)
        .then((data) => {
          console.log("SUCCESS CUSTOMER", JSON.stringify(data, undefined, 2));
          const updatedCustomer = updateCustomerInfo(data).then(
            (updatedCustomer) => {
              // console.log("UPDATED CUSTOMER", updatedCustomer);
              const updatedCustomer2 = getCustomerInfo(customerInput.id).then(
                (updatedCustomer2) => {
                  // console.log("UPDATED CUSTOMER2", updatedCustomer2);
                }
              );
            }
          );
          return data;
        })
        .catch((err) => {
          console.log("ERROR", err);
        });

      let discountResponse = JSON.parse(await checkForDiscount(req.body)) ;
       console.log("prima dell'encrypting ", discountResponse);
      const discountResponseEncrypted = await encrypt(discountResponse.attributeValue+"");
      console.log("dopo l'encrypting ", discountResponseEncrypted);
      discountResponse["attributeValue"] = discountResponseEncrypted;
      console.log("discountResponse dopo encrypt: ",discountResponse);
      res.header("Access-Control-Allow-Origin");
      res.send(JSON.stringify(discountResponse));
      res.end();
      console.log("risposta inviata");
    } catch (error) {
      console.log("ERROR in applyLavaHooksApiEndpoints", error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/lv/config", async (req, res) => {
    configRespone = {};
    res.send(configResponse);
  });
}

const getCustomerInfo = async (id) => {
  // console.log("TESTING getUserInfo", id);
  id = "gid://shopify/Customer/" + id;
  const endpoint =
    "https://lava-shop-dev.myshopify.com/admin/api/2022-07/graphql.json";
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
  // console.log("QUERY", query);
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
  // console.log("TESTING updateCustomerInfo", customer);
  // console.log("CUSTOMER ID", customer.id);
  // id = customer.customer.id;
  const endpoint =
    "https://lava-shop-dev.myshopify.com/admin/api/2022-07/graphql.json";

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
  // console.log("mutation", mutation);
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
      // console.log("CUSTOMER Updated", JSON.stringify(data, undefined, 2));
      return data;
    })
    .catch((err) => {
      console.log("ERROR", err);
    });
};

async function checkForDiscount(data) {
  const response = {
    statusDiscount: "OK",
    attributeKey: "volume_code",
    attributeValue: "20::" + data.id, // replace with something like <userId>-<value> possibly encoded
  };
  return JSON.stringify(response);
}

function encrypt(text) {
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  console.log("cipher: ", cipher);
  console.log("encrypted: ",encrypted);
  let ciphertext = CryptoJS.AES.encrypt(plaintext, key, {iv: iv});
  console.log("ciphertextString: ", ciphertext.toString());
  return ciphertext.toString('hex');
}
