/**
 * The checkout extensions are built in react but are server side rendered,
 * this means we don't have access to some features like local storage and session storage.
 * 
 * Check the limitations
 */

// TODO: REWRITE THIS COMPONENT TO BE ABLE TO SHOW THE DISCOUNT AND USE POINTS.
// TODO: CHECK IF WE CAN MANAGE BOTH DISCOUNTS (% & €) IN THE SAME SHOPIFY FUNCTION - otherwise we'll have to use 2 discounts combined'

import React, { useEffect, useState } from "react";
import CryptoJS from "crypto-js";

import {
  render,
  Banner,
  useCartLines,
  useApplyAttributeChange,
  useApplyCartLinesChange,
  useAttributes,
  View,
  useCustomer,
  useTotalAmount,
} from "@shopify/checkout-ui-extensions-react";


// Set the entry points for the extension
render("Checkout::Dynamic::Render", () => <App />);

function encrypt(text, key, iv) {
  let ciphertext = CryptoJS.AES.encrypt(text, key, { iv: iv });
  // console.log("ciphertextString: ", ciphertext.toString());
  return ciphertext.toString();
}

function App() {
  const applyAttributeChange = useApplyAttributeChange();
  const applyCartLinesChange = useApplyCartLinesChange();
  const cartLines = useCartLines();
  const getAttributes = useAttributes();
  const [apiResponse, setApiResponse] = useState();
  const customer = useCustomer();
  const [totalPoints, setTotalPoints] = useState();
  const totalAmount = useTotalAmount();
  

  const testApplyLavaDiscount = async () => {
    // console.log("--- testApplyLavaDiscount");
    // console.log('--- customer', customer);
    // we get the first item of the cart to retrieve a valid ID for applyCartLinesChange
    const productId = cartLines[0].merchandise?.id;
    try {
      // call LAVA API
      // await fetch("https://jsonplaceholder.typicode.com/todos/1", {
      await fetch("https://af2d-91-81-94-158.eu.ngrok.io:60829/api/lv/cartupdate", {
        mode: "cors",
        credentials: "same-origin",
        headers: {
          "Bypass-Tunnel-Reminder": "true",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          // insert mocked data here
          const mock = {
            statusDiscount: "OK",
            attributeKey: "volume_code",
            attributeValue: "50::" + customer.id.split('/').at(-1),
          };
          data = mock; // add your object here
          setApiResponse(JSON.stringify(data));
          // console.log(" checkout ui LAVA RESPONSE IS ", data);
          try {
            //  Encrypting the cart attribute
            const key = CryptoJS.SHA256(customer.id);
            const iv = CryptoJS.enc.Base64.parse("AAAAAAAAAAAAAAAAAAAAAA==");
            const discountResponseEncrypted = encrypt(
              data.attributeValue,
              key,
              iv
            );
            data.attributeValue = discountResponseEncrypted;
            /**
             * we need to check if the current cart attribute is already setted
             * and is equal to the one retrieve by the api to avoid incurring in a loop
             */
            attributes = getAttributes;
            let foundAttribute = null;
            attributes.forEach(element => {
              if(element.key == 'volume_code'){
                foundAttribute = element.value; 
              }
            });
            
            console.log('--- foundAttribute', foundAttribute);
            if(foundAttribute == data.attributeValue){
              console.log('Attribute already setted and no need to change', data.value);
              return;
            }

            /* applyAttributeChange sets an arbitrary attribute to the cart
              insert attribute field in input.graphql and in api.rs as optional
             */
            // console.log('--- ENCRYPTED DATA', data);

            applyAttributeChange({
              key: "volume_code",
              type: "updateAttribute",
              value: data?.attributeValue,
            }).then(async (res) => {
              

              // check if the new attribute has been applied
              // console.log("applyAttributeChange res", res);
              // console.log("GET NEW ATTRIBUTES", getAttributes);
              // since the applyAttributeChange does not trigger the discount functions to be re-executed
              // we need to use applyCartLinesChange to update the cart
              // since we only have to trigger the discount function without adding any product
              // we set quantity to 0

              /**
               * commented this function since we are using the theme extension to set the cart attribute
               */

              await applyCartLinesChange({
                type: "addCartLine",
                merchandiseId: productId,
                quantity: 0,
              })
                .then((applyCartLinesChangeResponse) =>
                  console.log(
                    "applyCartLinesChangeResponse",
                    applyCartLinesChangeResponse
                  )
                )
                .catch((applyCartLinesChangeError) =>
                  console.error(
                    "applyCartLinesChangeError",
                    applyCartLinesChangeError
                  )
                );
            });
          } catch (e) {
            console.log("ERROR in applyAttributeChange", e);
          }
        });
    } catch (error) {
      console.log("API CALL ERROR", error);
    }
  };

  const redeemPoints = async () => {
    console.log('--- REDEEM POINTS');
    /**
     * Ask Lavan how many points we have.
     * We could have more points than the actual cart value.
     * 
     */
    const pointsResponseValue = 3000; // get it from Lava
    setTotalPoints(pointsResponseValue);


  }

  useEffect(() => {
    if (!apiResponse) {
      testApplyLavaDiscount();
    }
  }, []);

  // Render checkout-ui
  return (
      <></>
      // <Banner title={"Test smart discount via external api service"}>
      //   <View>Step 1: fetch data from an external API (now using a mocked api)</View>
      //   <View>Step 2: set a cart attribute specific for the discount needed</View>
      //   <View>Step 3: update the cart to apply the discount.</View>
      //   <View>&nbsp;</View>
      //   <View>&nbsp;</View>
      //   <View>PROS: the customization use the new Shopify approach implementing a checkout ui extension + cloud functions</View>
      //   <View>CONS: we need to load the cart twice in order to re-run the discount calculation</View>
      //   <View>Optimal solution: we need to find a way to set the cart attribute before entering the checkout page intercepting the user at login or autologin</View>
      //   <View>&nbsp;</View>
      //   <View>MOCKED RESPONSE FROM API: {apiResponse}</View>
      //   <View>&nbsp;</View> 
      // </Banner>
  ); 
}