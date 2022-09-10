import React, { useEffect, useState } from "react";

import {
  render,
  Banner,
  useCartLines,
  useApplyAttributeChange,
  useApplyCartLinesChange,
  useAttributes,
  View,
} from "@shopify/checkout-ui-extensions-react";


// Set the entry points for the extension
render("Checkout::Dynamic::Render", () => <App />);

function App() {
  const applyAttributeChange = useApplyAttributeChange();
  const applyCartLinesChange = useApplyCartLinesChange();
  const cartLines = useCartLines();
  const getAttributes = useAttributes();
  const [apiResponse, setApiResponse] = useState();
  

  const testApplyLavaDiscount = async () => {
    console.log("testApplyLavaDiscount");
    // we get the first item of the cart to retrieve a valid ID for applyCartLinesChange
    const productId = cartLines[0].merchandise?.id;
    try {
      // call LAVA API
      await fetch("https://jsonplaceholder.typicode.com/users/1", {
        mode: "cors",
        credentials: "same-origin",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Bypass-Tunnel-Reminder": "true",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          // insert mocked data here
          const mock = {
            memberType: 'SILVER',
            value: '50'
          };
          data = mock; // add your object here
          setApiResponse(JSON.stringify(data));
          console.log(" LAVA RESPONSE IS ", data);
          try {
            

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

            if(foundAttribute == data.value){
              console.warn('Attribute already setted and no need to change');
              return;
            }

            /* applyAttributeChange sets an arbitrary attribute to the cart
              insert attribute field in input.graphql and in api.rs as optional
             */
            applyAttributeChange({
              key: "volume_code",
              type: "updateAttribute",
              value: data?.value,
            }).then(async (res) => {
              // check if the new attribute has been applied
              console.log("applyAttributeChange res", res);
              console.log("GET NEW ATTRIBUTES", getAttributes);
              // since the applyAttributeChange does not trigger the discount functions to be re-executed
              // we need to use applyCartLinesChange to update the cart
              // since we only have to trigger the discount function without adding any product
              // we set quantity to 0

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

  useEffect(() => {
    if (!apiResponse) {
      testApplyLavaDiscount();
    }
  }, []);

  // Render checkout-ui
  return (
      <Banner title={"Test smart discount via external api service"}>
        <View>Step 1: fetch data from an external API (now using a mocked api)</View>
        <View>Step 2: set a cart attribute specific for the discount needed</View>
        <View>Step 3: update the cart to apply the discount.</View>
        <View>&nbsp;</View>
        <View>&nbsp;</View>
        <View>PROS: the customization use the new Shopify approach implementing a checkout ui extension + cloud functions</View>
        <View>CONS: we need to load the cart twice in order to re-run the discount calculation</View>
        <View>Optimal solution: we need to find a way to set the cart attribute before entering the checkout page intercepting the user at login or autologin</View>
        <View>&nbsp;</View>
        MOCKED RESPONSE FROM API: {apiResponse}
      </Banner>
  ); 
}