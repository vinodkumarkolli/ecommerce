import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { ZeptoMailNotificationProvider } from "./service"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [ZeptoMailNotificationProvider],
})
