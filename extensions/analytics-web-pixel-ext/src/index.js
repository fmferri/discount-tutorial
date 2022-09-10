import { register } from "@shopify/web-pixels-extension";

console.log("PIXEEEL");
register(async ({ configuration, analytics, browser }) => {
  console.log("PIXEEEL register");
  // Bootstrap and insert pixel script tag here
  const uid = await browser.cookie.get("your_visitor_cookie");

  // Sample subscribe to page view
  analytics.subscribe("page_viewed", (event) => {
    console.log("Page viewed", event);
  });

  // subscribe to events
  analytics.subscribe("all_events", (event) => {
    // transform the event payload to fit your schema (optional)

    console.log("--- pixel event", event);
  });
});
