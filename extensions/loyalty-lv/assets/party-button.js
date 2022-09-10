class PartyButton extends HTMLButtonElement {
  constructor() {
    super();
  }

  connectedCallback() {
    console.log("connectedCallback in PartyButton");
    this.addEventListener("click", this.partyTime);
  }

  partyTime() {
    console.log("PartyButton is clicked");
  }
}

customElements.define("party-button", PartyButton, { extends: "button" });

class CustomerInfo extends HTMLDivElement {
  constructor() {
    super();
  }

  connectedCallback() {
    console.log("connectedCallback in HiddenCustomerInfo");

    // const content = document
    //   .querySelector("#lv-customer-info")
    //   .serializeArray();
    let formData = {};
    const formEntity = new FormData(
      document.querySelector("#lv-customer-info")
    );
    console.log("formEntity", formEntity.entries());
    for (var pair of formEntity.entries()) {
      console.log(pair[0] + ": " + pair[1]);
      formData[pair[0]] = pair[1];
    }
    console.log("formData", formData);
    fetch("/apps/lv-loyalty/api/lv/cartupdate", {
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
      });
  }

  loaded({ target }) {
    console.log("HiddenCustomerInfo loaded", data);
  }
}

customElements.define("customer-info", CustomerInfo, { extends: "div" });
