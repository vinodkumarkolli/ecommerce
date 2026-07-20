# Custom Fulfillment & Calculated Shipping

In Medusa V2, if you need to calculate shipping prices dynamically based on the contents of the cart (e.g., if the cart contains only a specific product, shipping is free; otherwise, it is a fixed amount), the correct architectural approach is to use a **Custom Fulfillment Provider** and **Calculated Shipping Options**.

## 1. Creating the Custom Fulfillment Provider

Create a module in `src/modules/custom-fulfillment` that extends `AbstractFulfillmentProviderService`.

### `src/modules/custom-fulfillment/service.ts`
```typescript
import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils";
import { 
  CalculatedShippingOptionPrice, 
  CalculateShippingOptionPriceContext, 
  CreateFulfillmentResult, 
  FulfillmentOption, 
  ValidateFulfillmentDataContext 
} from "@medusajs/types";

export default class CustomFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "custom_fulfillment";

  constructor() {
    super();
  }

  // Define your fulfillment options
  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "custom-standard",
      }
    ];
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: ValidateFulfillmentDataContext
  ): Promise<any> {
    return { ...data };
  }

  // The core logic for Calculated Shipping
  async calculatePrice(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: CalculateShippingOptionPriceContext
  ): Promise<CalculatedShippingOptionPrice> {
    
    // Safely extract items from the context in Medusa V2
    const items = (context as any).items || (context as any).cart?.items || [];

    // Example logic: Weight-based Shipping Cost Calculator
    // Free shipping if only the Trial Pack is in the cart
    const isTrialPackItem = (item: any) => 
      item.product_title?.includes("Trial Pack") || 
      item.variant?.title?.includes("Trial Pack") ||
      item.variant_title?.includes("Trial Pack");
    
    const hasTrialPack = items.some(isTrialPackItem);
    const hasOtherItems = items.some((item: any) => !isTrialPackItem(item));

    if (hasTrialPack && !hasOtherItems) {
      return { calculated_amount: 0 };
    }
    
    // Calculate total weight (excluding trial packs)
    let totalWeight = 0;
    for (const item of items) {
      if (!isTrialPackItem(item)) {
        const weight = item.variant?.weight || 500;
        totalWeight += weight * item.quantity;
      }
    }

    let calculated_amount = 80;

    if (totalWeight <= 1100) {
      calculated_amount = 80;
    } else {
      // For every 1100g (or part thereof) above the base 1100g, add 64 INR
      const extraWeight = totalWeight - 1100;
      calculated_amount = 80 + (Math.ceil(extraWeight / 1100) * 64);
    }
    
    return { calculated_amount }; 
  }

  async canCalculate(): Promise<boolean> { return true; }
  async validateOption(data: Record<string, any>): Promise<boolean> { return true; }
  async createFulfillment(): Promise<CreateFulfillmentResult> { return { data: {} }; }
  async cancelFulfillment(): Promise<any> { return {}; }
  async createReturnFulfillment(): Promise<CreateFulfillmentResult> { return { data: {} }; }
}
```

### Storefront UI Requirement for Calculated Shipping
> [!IMPORTANT]
> The default `GET /store/shipping-options` API endpoint does **not** return the `amount` for calculated shipping options. To display the calculated price, the Storefront must retrieve the amount from the Cart's `shipping_methods` object *after* the shipping option has been selected and added to the cart (via `POST /store/carts/:id/shipping-methods`). 
> Ensure your checkout `OrderSummary` uses `cart?.shipping_methods?.find(m => m.shipping_option_id === selectedShippingOption)?.amount` instead of relying on the `shippingOptions` array.

### `src/modules/custom-fulfillment/index.ts`
```typescript
import CustomFulfillmentService from "./service"
import { ModuleProvider, Modules } from "@medusajs/framework/utils"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [CustomFulfillmentService],
})
```

## 2. Registering in `medusa-config.ts`

Replace or add your provider to the `Modules.FULFILLMENT` array in `medusa-config.ts`:

```typescript
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "./src/modules/custom-fulfillment",
            id: "custom_fulfillment",
            options: {},
          },
        ],
      },
    },
```

## 3. Configuring the Database (Seeding)

To link your new custom provider and enable calculated pricing, you must configure your Shipping Options appropriately. 

When creating or seeding a shipping option intended for calculated pricing:
1. Set `price_type: "calculated"`.
2. Do **not** pass a fixed `amount` or `prices` array.
3. Set the `provider_id` to your custom provider's internal ID (e.g. `custom_fulfillment_custom_fulfillment`).

### Example `seed.json` Entry:
```json
    {
      "name": "Standard",
      "service_code": "standard-delivery",
      "price_type": "calculated",
      "region_name": "Indian Region",
      "provider_id": "custom_fulfillment",
      "shipping_profile_name": "Standard Shipping Profile",
      "rules": [
        {
          "attribute": "enabled_in_store",
          "operator": "eq",
          "value": "true"
        },
        {
          "attribute": "is_return",
          "operator": "eq",
          "value": "false"
        }
      ]
    }
```

> [!IMPORTANT]  
> If using a custom seed script, ensure you conditionally exclude the `prices` property when creating the shipping option via `createShippingOptionsWorkflow` if `price_type` is `"calculated"`. Passing a `prices` array to a calculated option will crash Medusa.
