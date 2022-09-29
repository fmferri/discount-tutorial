import { useState } from "react";
import { useForm, useField } from "@shopify/react-form";
import { useParams } from "react-router-dom";
import { CurrencyCode } from "@shopify/react-i18n";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";

import {
  ActiveDatesCard,
  CombinationCard,
  DiscountClass,
  DiscountMethod,
  MethodCard,
  DiscountStatus,
  RequirementType,
  SummaryCard,
  UsageLimitsCard,
  onBreadcrumbAction,
} from "@shopify/discount-app-components";
import {
  Banner,
  Card,
  Layout,
  Page,
  TextField,
  Stack,
  PageActions,
  Spinner,
  Modal,
  TextContainer,
  RadioButton,
  ChoiceList,
} from "@shopify/polaris";

import metafields from '../../metafields'
import { useAuthenticatedFetch, useDiscount } from "../../hooks";

const todaysDate = new Date();
const FUNCTION_ID = "01GE2QMGK3T8RM7JMQS094XR0K";

export default function LavaDiscountNew() {
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const currencyCode = CurrencyCode.Cad;
  const authenticatedFetch = useAuthenticatedFetch();
  const { id } = useParams();
  const { discount, isLoading } = useDiscount(id);
  const [deleteModalActive, setDeleteModalActive] = useState(false);
  const [discountType, setDiscountType] = useState();
  const [secret, setSecret] = useState('');

  const {
    fields: {
      discountTitle,
      discountCode,
      discountMethod,
      combinesWith,
      requirementType,
      requirementSubtotal,
      requirementQuantity,
      usageTotalLimit,
      usageOncePerCustomer,
      startDate,
      endDate,
      configuration,
    },
    submit,
    submitting,
    dirty,
    reset,
    submitErrors,
    makeClean,
  } = useForm({
    fields: {
      discountTitle: useField(discount?.title || ""),
      discountMethod: useField(discount?.method || DiscountMethod.Code),
      discountCode: useField(discount?.code || ""),
      combinesWith: useField(
        discount?.combinesWith || {
          orderDiscounts: false,
          productDiscounts: false,
          shippingDiscounts: false,
        }
      ),
      requirementType: useField(RequirementType.None),
      requirementSubtotal: useField("0"),
      requirementQuantity: useField("0"),
      usageTotalLimit: useField(discount?.usageLimit || null),
      usageOncePerCustomer: useField(discount?.appliesOncePerCustomer || false),
      startDate: useField(discount?.startsAt || todaysDate),
      endDate: useField(discount?.endsAt || null),
      configuration: {
        // Add quantity and percentage configuration
        quantity: useField(discount?.configuration?.quantity || "1"),
        percentage: useField(discount?.configuration?.percentage || "0"),
        amount: useField(discount?.configuration?.amount || "0"),
        secret: useField(discount?.configuration?.secret || null),
        discountType: useField( discount?.configuration?.discountType || null),
      },
    },
    onSubmit: async (form) => {
      const updatedDiscount = {
        functionId: FUNCTION_ID,
        combinesWith: form.combinesWith,
        startsAt: form.startDate,
        endsAt: form.endDate,
        metafields: [
          {
            id: discount.configurationId, // metafield id is required for update
            namespace: metafields.namespace,
            key: metafields.key,
            type: "json",
            value: JSON.stringify({
              quantity: parseInt(form.configuration.quantity),
              percentage: parseFloat(form.configuration.percentage),
              amount: parseInt(form.configuration.amount),
              secret: form.configuration.secret,
              discountType: form.configuration.discountType,
            }),
          },
        ],
      };

      let uri = `/api/discounts/`;
      if (form.discountMethod === DiscountMethod.Code) {
        uri += "code/";

        updatedDiscount.usageLimit = parseInt(form.usageTotalLimit);
        updatedDiscount.appliesOncePerCustomer = form.usageOncePerCustomer;
        updatedDiscount.code = form.discountCode;
        updatedDiscount.title = form.discountCode;
      } else {
        uri += "automatic/";

        updatedDiscount.title = form.discountTitle;
      }
      let response = await authenticatedFetch(uri + id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discount: updatedDiscount }),
      });

      const {
        errors, // errors like missing scope access
        data,
      } = await response.json();

      const remoteErrors = errors || data?.discountUpdate?.userErrors;

      if (remoteErrors?.length > 0) {
        return { status: "fail", errors: remoteErrors };
      }

      redirect.dispatch(Redirect.Action.ADMIN_SECTION, {
        name: Redirect.ResourceType.Discount,
      });

      return { status: "success" };
    },
  });

  console.log('--- configuration', configuration );
  console.log('--- DISCOUNT', discount);

  const handleDeleteDiscount = async () => {
    await authenticatedFetch(
      `/api/discounts/${
        discountMethod.value === DiscountMethod.Automatic ? "automatic" : "code"
      }/${discount.id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    redirect.dispatch(Redirect.Action.ADMIN_SECTION, {
      name: Redirect.ResourceType.Discount,
    });
  };

  const toggleDeleteModalActive = () => {
    setDeleteModalActive((deleteModalActive) => !deleteModalActive);
  };

  const errorBanner =
    submitErrors.length > 0 ? (
      <Layout.Section>
        <Banner status="critical">
          <p>There were some issues with your form submission:</p>
          <ul>
            {submitErrors.map(({ message }, index) => {
              return <li key={`${message}${index}`}>{message}</li>;
            })}
          </ul>
        </Banner>
      </Layout.Section>
    ) : null;

  return (
    <Page
      title="Edit volume discount"
      breadcrumbs={[
        {
          content: "Discounts",
          onAction: () => onBreadcrumbAction(redirect, true),
        },
      ]}
      primaryAction={{
        content: "Save",
        onAction: submit,
        disabled: !dirty,
        loading: submitting,
      }}
    >
      {isLoading && (
        <Layout>
          <Stack distribution="center">
            <Spinner size="large" />
          </Stack>
        </Layout>
      )}

      {!isLoading && (
        <Layout>
          {errorBanner}
          <Layout.Section>
            <form onSubmit={submit}>
              <MethodCard
                title="Discount Mode"
                discountTitle={discountTitle}
                discountClass={DiscountClass.Order}
                discountCode={discountCode}
                discountMethod={discountMethod}
              />
              <Card title="Discount Type">
                <Card.Section>
                    <Stack>
                  <RadioButton
                    label="Percentage discount"
                    helpText="Customers will receive a percentage discount based on their status."
                    value='percentageDiscount'
                    checked={configuration.discountType.value === 'percentageDiscount'}
                    onChange={() => { 
                        configuration.discountType.value = 'percentageDiscount';
                        configuration.discountType.dirty = true;
                        configuration.discountType.touched = true;
                        setDiscountType('percentageDiscount')
                    }}
                  />
                  <RadioButton
                    label="Amount Discount"
                    helpText="Customers will be able to redeem points as discount."
                    value='amountDiscount'
                    checked={configuration.discountType.value === 'amountDiscount'}
                    onChange={() => {
                        configuration.discountType.value = 'amountDiscount';
                        configuration.discountType.dirty = true;
                        configuration.discountType.touched = true;
                        setDiscountType('amountDiscount')
                    }}
                  />
               
                </Stack>
                <Stack>
                  <TextField
                    label="Minimum quantity"
                    {...configuration.quantity}
                  />
                  {configuration.discountType.value === 'percentageDiscount' && 
                    <TextField
                      label="Discount percentage"
                      {...configuration.percentage}
                      suffix="%"
                    />
                  }
                  {configuration.discountType.value === 'amountDiscount' && 
                    <TextField
                      label="Discount amount"
                      {...configuration.amount}
                      suffix="$"
                    />                
                  }
                </Stack>
                </Card.Section>
              </Card>
              <Card title="Discount Secret">
                <Card.Section>              
                    Choose a secret key for security purposes 
                    <TextField                   
                    label="Secret Key"
                    {...configuration.secret}
                    />    
                </Card.Section>
            </Card>
              {discountMethod.value === DiscountMethod.Code && (
                <UsageLimitsCard
                  totalUsageLimit={usageTotalLimit}
                  oncePerCustomer={usageOncePerCustomer}
                />
              )}
              <CombinationCard
                combinableDiscountTypes={combinesWith}
                discountClass={DiscountClass.Order}
                discountDescriptor={
                  discountMethod.value === DiscountMethod.Automatic
                    ? discountTitle.value
                    : discountCode.value
                }
              />
              <ActiveDatesCard
                startDate={startDate}
                endDate={endDate}
                timezoneAbbreviation="EST"
              />
            </form>
          </Layout.Section>
          <Layout.Section secondary>
            <SummaryCard
              header={{
                discountMethod: discountMethod.value,
                discountDescriptor:
                  discountMethod.value === DiscountMethod.Automatic
                    ? discountTitle.value
                    : discountCode.value,
                appDiscountType: "Volume",
                isEditing: false,
              }}
              performance={{
                status: DiscountStatus.Scheduled,
                usageCount: 0,
              }}
              minimumRequirements={{
                requirementType: requirementType.value,
                subtotal: requirementSubtotal.value,
                quantity: requirementQuantity.value,
                currencyCode: currencyCode,
              }}
              usageLimits={{
                oncePerCustomer: usageOncePerCustomer.value,
                totalUsageLimit: usageTotalLimit.value,
              }}
              activeDates={{
                startDate: startDate.value,
                endDate: endDate.value,
              }}
            />
          </Layout.Section>
          <Layout.Section>
            <PageActions
              primaryAction={{
                content: "Save discount",
                onAction: submit,
                disabled: !dirty,
                loading: submitting,
              }}
              secondaryActions={[
                {
                  content: "Delete",
                  destructive: true,
                  onAction: toggleDeleteModalActive,
                },
              ]}
            />
          </Layout.Section>

          <Modal
            small
            open={deleteModalActive}
            onClose={toggleDeleteModalActive}
            title="Delete discount"
            primaryAction={{
              content: "Delete",
              destructive: true,
              onAction: handleDeleteDiscount,
            }}
            secondaryActions={[
              {
                content: "Cancel",
                onAction: toggleDeleteModalActive,
              },
            ]}
          >
            <Modal.Section>
              <TextContainer>
                <p>Are you sure you want to delete this discount?</p>
              </TextContainer>
            </Modal.Section>
          </Modal>
        </Layout>
      )}
    </Page>
  );
}
