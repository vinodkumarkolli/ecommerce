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
    return {
      ...data,
    };
  }

  async calculatePrice(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: CalculateShippingOptionPriceContext
  ): Promise<any> {
    const isTrialPackItem = (item: any) => 
      item.product_title?.includes("Trial Pack") || 
      item.title?.includes("Trial Pack") || 
      item.variant?.product?.handle === "sastry-balm-5-inr-trial" ||
      item.product_handle === "sastry-balm-5-inr-trial";

    const items = (context as any).items || (context as any).cart?.items || [];
    
    let totalWeight = 0;
    let hasOtherItems = false;
    let hasTrialPack = false;

    for (const item of items) {
      if (isTrialPackItem(item)) {
        hasTrialPack = true;
      } else {
        hasOtherItems = true;
        const weight = item.variant?.weight || 0;
        const quantity = item.quantity || 1;
        totalWeight += weight * quantity;
      }
    }

    if (hasTrialPack && !hasOtherItems) {
      return { calculated_amount: 0 }; 
    }

    let calculated_amount = 80;

    if (totalWeight <= 1100) {
      calculated_amount = 80;
    } else {
      // For every 1100g (or part thereof) above the base 1100g, add 64 INR
      const extraWeight = totalWeight - 1100;
      calculated_amount = 80 + (Math.ceil(extraWeight / 1100) * 64);
    }
    
    console.log("calculated_amount output:", calculated_amount, "for total weight:", totalWeight);
    return { calculated_amount }; 
  }

  async canCalculate(): Promise<boolean> {
    return true;
  }

  async validateOption(data: Record<string, any>): Promise<boolean> {
    return true;
  }

  async createFulfillment(): Promise<CreateFulfillmentResult> {
    return { data: {} };
  }

  async cancelFulfillment(): Promise<any> {
    return {};
  }

  async createReturnFulfillment(): Promise<CreateFulfillmentResult> {
    return { data: {} };
  }
}
