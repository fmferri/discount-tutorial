#[macro_use]
extern crate magic_crypt;
use serde::Serialize;

mod api;
use api::*;

use magic_crypt::MagicCryptTrait;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let input: input::Input = serde_json::from_reader(std::io::BufReader::new(std::io::stdin()))?;
    let mut out = std::io::stdout();
    let mut serializer = serde_json::Serializer::new(&mut out);
    function(input)?.serialize(&mut serializer)?;
    Ok(())
}

fn function(input: input::Input) -> Result<FunctionResult, Box<dyn std::error::Error>> {
    // extract variables so we dont need to use map functions
    let mut config: input::Configuration = input.configuration();
    let cart_lines = input.cart.lines;
    let cart_attribute = input.cart.attribute;
    let buyer_identity = input.cart.buyerIdentity;
    let email = buyer_identity.email;
    let customer_id = buyer_identity.customer.id.to_string();

    if customer_id.is_empty() {
        // if the customer id is empty return no discount
        panic!("Customer id is_empty{:?}", cart_attribute);
        return Ok(FunctionResult {
            discounts: vec![],
            discount_application_strategy: DiscountApplicationStrategy::First,
        });
    }

    if cart_attribute.is_some() {
        // read che attribute
        let mut attribute = cart_attribute
            .map(|cart_attribute| cart_attribute.value)
            .expect("REASON")
            .to_string();

        //inserire decrypting of attribute
        // println!("attribute: {:?}", attribute);
        // panic!("attribute: {:?}", attribute);
        //testing
        let mc = new_magic_crypt!(customer_id.clone(), 256);

        let attribute = mc.decrypt_base64_to_string(&attribute);
        // panic!("attribute {:?}", attribute);
        let attribute = attribute.unwrap();
        //end testing

        let value = attribute.split("::").nth(0).unwrap();
        let id = attribute.split("::").nth(1).unwrap();
        // panic!("id: {:?}", id);
        if "gid://shopify/Customer/".to_owned() + id == customer_id {
            config.percentage = value.parse::<f64>().unwrap();
        } else {
            panic!("Invalid condition id {}", id);
            return Ok(FunctionResult {
                discounts: vec![],
                discount_application_strategy: DiscountApplicationStrategy::First,
            });
        }
    }

    if cart_lines.is_empty() || config.percentage == 0.0 {
        return Ok(FunctionResult {
            discounts: vec![],
            discount_application_strategy: DiscountApplicationStrategy::First,
        });
    }

    let mut targets = vec![];
    for line in cart_lines {
        if line.quantity >= config.quantity {
            targets.push(Target::ProductVariant {
                id: line.merchandise.id.unwrap_or_default(),
                quantity: None,
            });
        }
    }

    if targets.is_empty() {
        return Ok(FunctionResult {
            discounts: vec![],
            discount_application_strategy: DiscountApplicationStrategy::First,
        });
    }

    Ok(FunctionResult {
        discounts: vec![Discount {
            message: None,
            conditions: None,
            targets,
            value: Value::Percentage(Percentage {
                value: config.percentage,
            }),
            // value: Value::
        }],
        discount_application_strategy: DiscountApplicationStrategy::First,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(configuration: Option<input::Configuration>) -> input::Input {
        let input = r#"
        {
            "cart": {
                "lines": [
                    {
                        "quantity": 5,
                        "merchandise": {
                            "id": "gid://shopify/ProductVariant/0"
                        }
                    },
                    {
                        "quantity": 1,
                        "merchandise": {
                            "id": "gid://shopify/ProductVariant/1"
                        }
                    }
                ]
            },
            "discountNode": { "metafield": null }
        }
        "#;
        let default_input: input::Input = serde_json::from_str(input).unwrap();
        let value = configuration.map(|x| serde_json::to_string(&x).unwrap());

        let discount_node = input::DiscountNode {
            metafield: Some(input::Metafield { value }),
        };

        input::Input {
            discount_node,
            ..default_input
        }
    }

    #[test]
    fn test_discount_with_no_configuration() {
        let input = input(None);
        let handle_result = serde_json::json!(function(input).unwrap());

        let expected_json = r#"
            {
                "discounts": [],
                "discountApplicationStrategy": "FIRST"
            }
        "#;

        let expected_handle_result: serde_json::Value =
            serde_json::from_str(expected_json).unwrap();
        assert_eq!(
            handle_result.to_string(),
            expected_handle_result.to_string()
        );
    }

    #[test]
    fn test_discount_with_configuration() {
        let input = input(Some(input::Configuration {
            quantity: 5,
            percentage: 10.0,
        }));
        let handle_result = serde_json::json!(function(input).unwrap());

        let expected_json = r#"
            {
                "discounts": [{
                    "targets": [
                        { "productVariant": { "id": "gid://shopify/ProductVariant/0" } }
                    ],
                    "value": { "percentage": { "value": 10.0 } }
                }],
                "discountApplicationStrategy": "FIRST"
            }
        "#;

        let expected_handle_result: serde_json::Value =
            serde_json::from_str(expected_json).unwrap();
        assert_eq!(
            handle_result.to_string(),
            expected_handle_result.to_string()
        );
    }
}
