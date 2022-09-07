import React, { useEffect, useState } from "react";
import {
  render,
  Banner,
  useCartLines,
  useApplyAttributeChange,
  useApplyCartLinesChange,
  useAttributes,
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
      await fetch("https://httpbin.org/ip", {
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
    <>
      <Banner title={"MY CHECKOUT UI - test automatic discount"}>
        RESPONSE FROM LAVA API CALL:: {apiResponse}
      </Banner>
    </>
  );
}