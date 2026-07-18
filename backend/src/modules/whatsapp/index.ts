import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { WhatsAppNotificationProvider } from "./service"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [WhatsAppNotificationProvider],
})
