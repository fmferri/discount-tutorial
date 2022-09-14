class PartyButton extends HTMLButtonElement {
  constructor() {
    super();
  }

  connectedCallback() {}
}

customElements.define("party-button", PartyButton, { extends: "button" });

class CustomerInfo extends HTMLDivElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    // READ THE DATA FROM THE FORM IN app-embed.liquid
    let formData = {};
    try {
      const formEntity = new FormData(
        document.querySelector("#lv-customer-info")
      );
      console.log("formEntity", formEntity.entries());
      for (var pair of formEntity.entries()) {
        formData[pair[0]] = pair[1];
      }
      console.log("formData", formData);
    } catch (error) {
      // USER IS NOT LOGGED
      console.warn("Error getting form data - THE USER IS NOT LOGGED", error);
      // REMOVE ATTRIBUTE FROM THE CART and sessionStorage
      await this.removeAtributeFromCart();
      /**
       * WE STOP THE EXECUTION AND EXIT FROM THE FUNCTION
       * WE DON'T NEED TO MAKE ANY CALL TO THE BACKEND SINCE WE ARE NOT LOGGED
       */
      return;
    }

    /**
     * USER IS LOGGED
     * WE NEED TO CALL THE BACKEND TO RETRIEVE THE ATTRIBUTE FOR THE SPECIFIC USER
     *
     * WE USE AN INTERNAL ENDPOINT TO MASK THE REAL SERVICE AND PROVIDE ADDITIONAL LOGIC IF REQUIRED
     *
     * Step 1
     * pass the user to the backend (inside our shopify app),
     * perform any required additional logic (TBD)
     * pass the call to our external service
     *
     * Step 2
     * retrieve the attribute from the call
     * set the attribute in the cart
     * set the attribute in sessionStorage to avoid the need to call at every page load
     */

    // If we already have a volume code in sessionStorage we don't need to call the service
    const volume_code = sessionStorage.getItem("volume_code");
    if (volume_code) {
      return;
    }
    const dataFetched = await fetch("/apps/lv-loyalty/api/lv/cartupdate", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((response) => {
        console.log("RESPONSE FROM FETCH", response);
        return response;
      });

    console.log("--- dataFetched", dataFetched);

    const cartAddAttribute = await fetch(
      window.Shopify.routes.root + "cart/update.js",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attributes: {
            volume_code: dataFetched.attributeValue.toString(),
          },
        }),
      }
    )
      .then((response) => response.json())
      .then(async (data) => {
        sessionStorage.setItem(
          "volume_code",
          dataFetched.attributeValue.toString()
        );
        return data;
      })
      .catch((error) => {
        console.log("ERROR SETTING THE CART ATTRIBUTE", error);
      });

    console.log("--- cartUpdatedAttribute", cartAddAttribute);
  }

  async removeAtributeFromCart() {
    sessionStorage.removeItem("volume_code");
    return fetch(window.Shopify.routes.root + "cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: {
          volume_code: null,
        },
      }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        console.log("cartAttributeRemoved", data);
        return data;
      })
      .catch((error) => {
        console.log("error removing attribute from cart", error);
        return error;
      });
  }

  loaded({ target }) {
    console.log("HiddenCustomerInfo loaded", data);
  }
}

customElements.define("customer-info", CustomerInfo, { extends: "div" });
