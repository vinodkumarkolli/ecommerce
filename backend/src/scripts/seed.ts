import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import fs from "fs"
import path from "path"

export default async function seed({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const storeService = container.resolve(Modules.STORE)
  const regionService = container.resolve(Modules.REGION)
  const taxService = container.resolve(Modules.TAX)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)
  const productService = container.resolve(Modules.PRODUCT)

  logger.info("Reading seed.json file...")
  const seedFile = path.resolve(process.cwd(), "seed.json")
  if (!fs.existsSync(seedFile)) {
    throw new Error(`Seed file not found at ${seedFile}`)
  }

  const seedData = JSON.parse(fs.readFileSync(seedFile, "utf-8"))

  // 1. Create Sales Channels
  logger.info("Seeding sales channels...")
  const salesChannelsData = seedData.sales_channels || []
  let defaultSalesChannel: any
  if (salesChannelsData.length > 0) {
    const channelName = salesChannelsData[0].name
    const existingChannels = await salesChannelService.listSalesChannels({ name: channelName })
    if (existingChannels.length === 0) {
      const { result } = await createSalesChannelsWorkflow(container).run({
        input: {
          salesChannelsData: salesChannelsData.map((sc: any) => ({
            name: sc.name,
            description: sc.description,
            is_disabled: sc.is_disabled
          }))
        }
      })
      defaultSalesChannel = result[0]
      logger.info(`Sales channel '${channelName}' created.`)
    } else {
      defaultSalesChannel = existingChannels[0]
      logger.info(`Sales channel '${channelName}' already exists.`)
    }
  }

  // Create default Publishable API Key and link to sales channel
  logger.info("Checking Publishable API Keys...")
  const apiKeyService = container.resolve(Modules.API_KEY)
  const existingApiKeys = await apiKeyService.listApiKeys({ title: "Default Publishable API Key" })
  let publishableApiKey: any
  if (existingApiKeys.length === 0) {
    const { result: apiKeys } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Default Publishable API Key",
            type: "publishable",
            created_by: ""
          }
        ]
      }
    })
    publishableApiKey = apiKeys[0]
    logger.info("Publishable API key created.")
    
    if (defaultSalesChannel && publishableApiKey) {
      await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: {
          id: publishableApiKey.id,
          add: [defaultSalesChannel.id]
        }
      })
    }
  } else {
    publishableApiKey = existingApiKeys[0]
    logger.info("Publishable API key already exists.")
  }

  // 2. Create Store
  logger.info("Seeding store configuration...")
  const storeData = seedData.store || {}
  const existingStores = await storeService.listStores()
  let store = existingStores[0]
  if (!store) {
    const { result: stores } = await createStoresWorkflow(container).run({
      input: {
        stores: [
          {
            name: storeData.name || "Ecommerce Store",
            supported_currencies: storeData.supported_currencies || [
              { currency_code: "inr", is_default: true }
            ],
            default_sales_channel_id: defaultSalesChannel?.id
          }
        ]
      }
    })
    store = stores[0]
    logger.info("Store created.")
  } else {
    logger.info(`Store '${store.name}' already exists.`)
  }

  // 3. Create Regions
  logger.info("Seeding regions...")
  const regionsData = seedData.regions || []
  const createdRegions: Record<string, any> = {}
  for (const region of regionsData) {
    const existing = await regionService.listRegions({ name: region.name })
    if (existing.length === 0) {
      const { result } = await createRegionsWorkflow(container).run({
        input: {
          regions: [
            {
              name: region.name,
              currency_code: region.currency_code,
              countries: region.countries,
              payment_providers: region.payment_providers,
              metadata: region.metadata
            }
          ]
        }
      })
      createdRegions[region.name] = result[0]
      logger.info(`Region '${region.name}' created.`)
    } else {
      createdRegions[region.name] = existing[0]
      logger.info(`Region '${region.name}' already exists.`)
    }
  }

  // 4. Create Tax Regions
  logger.info("Seeding tax regions...")
  const taxRegionsData = seedData.tax_regions || []
  for (const tr of taxRegionsData) {
    const existing = await taxService.listTaxRegions({ country_code: tr.country_code })
    if (existing.length === 0) {
      await createTaxRegionsWorkflow(container).run({
        input: [
          {
            country_code: tr.country_code,
            provider_id: "tp_system"
          }
        ]
      })
      logger.info(`Tax region for '${tr.country_code}' created.`)
    } else {
      logger.info(`Tax region for '${tr.country_code}' already exists.`)
    }
  }

  // 6. Create Shipping Profiles
  logger.info("Seeding shipping profiles...")
  const profilesData = seedData.shipping_profiles || []
  const createdProfiles: Record<string, any> = {}
  for (const prof of profilesData) {
    const existing = await fulfillmentService.listShippingProfiles({ name: prof.name })
    if (existing.length === 0) {
      const { result } = await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: prof.name,
              type: prof.type
            }
          ]
        }
      })
      createdProfiles[prof.name] = result[0]
      logger.info(`Shipping profile '${prof.name}' created.`)
    } else {
      createdProfiles[prof.name] = existing[0]
      logger.info(`Shipping profile '${prof.name}' already exists.`)
    }
  }

  // 5. Create Stock Locations, Fulfillment Sets, and Shipping Options
  logger.info("Seeding stock locations...")
  const locationsData = seedData.stock_locations || []
  const createdLocations: Record<string, any> = {}
  for (const loc of locationsData) {
    const existing = await stockLocationService.listStockLocations({ name: loc.name })
    let stockLocation: any
    if (existing.length === 0) {
      const { result } = await createStockLocationsWorkflow(container).run({
        input: {
          locations: [
            {
              name: loc.name,
              address: loc.address
            }
          ]
        }
      })
      stockLocation = result[0]
      logger.info(`Stock location '${loc.name}' created.`)
    } else {
      stockLocation = existing[0]
      logger.info(`Stock location '${loc.name}' already exists.`)
    }

    createdLocations[loc.name] = stockLocation

    // Link location to sales channel
    if (defaultSalesChannel) {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: {
          id: stockLocation.id,
          add: [defaultSalesChannel.id]
        }
      })
      logger.info(`Linked location '${loc.name}' to sales channel '${defaultSalesChannel.name}'.`)
    }

    // Link location to manual fulfillment provider
    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: "manual_manual",
      },
    })
    logger.info(`Linked location '${loc.name}' to fulfillment provider 'manual_manual'.`)

    // Create Fulfillment Set for delivery (Use Query Graph to resolve service_zones)
    logger.info(`Checking fulfillment set for '${loc.name}'...`)
    const { data: existingSets } = await query.graph({
      entity: "fulfillment_set",
      fields: ["id", "name", "service_zones.id"],
      filters: { name: `${loc.name} Delivery Set` }
    })
    
    let fulfillmentSet: any
    if (existingSets.length === 0) {
      fulfillmentSet = await fulfillmentService.createFulfillmentSets({
        name: `${loc.name} Delivery Set`,
        type: "shipping",
        service_zones: [
          {
            name: "India Zone",
            geo_zones: [
              {
                country_code: "in",
                type: "country"
              }
            ]
          }
        ]
      })

      // Link fulfillment set to stock location
      await link.create({
        [Modules.STOCK_LOCATION]: {
          stock_location_id: stockLocation.id,
        },
        [Modules.FULFILLMENT]: {
          fulfillment_set_id: fulfillmentSet.id,
        },
      })
      logger.info(`Fulfillment set linked for '${loc.name}'.`)

      // Reload to get the populated service zones
      const { data: reloadedSets } = await query.graph({
        entity: "fulfillment_set",
        fields: ["id", "name", "service_zones.id"],
        filters: { id: fulfillmentSet.id }
      })
      fulfillmentSet = reloadedSets[0]
    } else {
      fulfillmentSet = existingSets[0]
      logger.info(`Fulfillment set already exists for '${loc.name}'.`)
    }

    // Create Shipping Options linked to the Service Zone and Region
    logger.info("Seeding shipping options...")
    const optionsData = seedData.shipping_options || []
    for (const opt of optionsData) {
      const existingOptions = await fulfillmentService.listShippingOptions({ name: opt.name })
      if (existingOptions.length > 0) {
        // Delete existing shipping option to recreate it under the correct shipping profile
        await fulfillmentService.deleteShippingOptions(existingOptions.map((o: any) => o.id))
        logger.info(`Deleted existing shipping option '${opt.name}' to force profile update.`)
      }

      const region = createdRegions[opt.region_name]
      const profile = createdProfiles[opt.shipping_profile_name]
      if (region && profile && fulfillmentSet.service_zones && fulfillmentSet.service_zones.length > 0) {
        await createShippingOptionsWorkflow(container).run({
          input: [
            {
              name: opt.name,
              price_type: opt.price_type,
              provider_id: "manual_manual",
              service_zone_id: fulfillmentSet.service_zones[0].id,
              shipping_profile_id: profile.id,
              prices: [
                {
                  currency_code: region.currency_code,
                  amount: opt.amount
                }
              ],
              type: {
                label: opt.name,
                description: opt.metadata?.delivery_time || "",
                code: opt.service_code
              },
              rules: opt.rules || [],
              metadata: opt.metadata
            }
          ]
        })
        logger.info(`Shipping option '${opt.name}' created.`)
      }
    }
  }

  // 8. Seeding Products
  logger.info("Seeding products...")
  const productsData = seedData.products || []
  for (const prod of productsData) {
    const existing = await productService.listProducts({ handle: prod.handle })
    let product: any
    if (existing.length === 0) {
      const { result } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: prod.title,
              handle: prod.handle,
              description: prod.description,
              thumbnail: prod.thumbnail,
              status: prod.status,
              type: prod.type ? { value: prod.type } : undefined,
              sales_channels: defaultSalesChannel ? [{ id: defaultSalesChannel.id }] : undefined,
              options: prod.options,
              variants: prod.variants.map((v: any) => ({
                title: v.title,
                sku: v.sku,
                options: v.options,
                prices: v.prices.map((p: any) => ({
                  currency_code: p.currency_code,
                  amount: p.amount
                }))
              }))
            }
          ]
        }
      })
      product = result[0]
      logger.info(`Product '${prod.title}' created.`)
    } else {
      product = existing[0]
      logger.info(`Product '${prod.title}' already exists.`)
    }

    // Link product to the Ecomm Retail sales channel
    if (defaultSalesChannel && product) {
      await link.create({
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
        [Modules.SALES_CHANNEL]: {
          sales_channel_id: defaultSalesChannel.id,
        },
      })
      logger.info(`Linked product '${product.title}' to sales channel '${defaultSalesChannel.name}'.`)
    }

    // Link product to the custom shipping profile
    const customProfile = createdProfiles["Indian Interstate Shipping Profile"]
    if (customProfile && product) {
      await link.create({
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
        [Modules.FULFILLMENT]: {
          shipping_profile_id: customProfile.id,
        },
      })
      logger.info(`Linked product '${product.title}' to shipping profile '${customProfile.name}'.`)
    }
  }

  logger.info("Database seeding completed successfully!")
}
