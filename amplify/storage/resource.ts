
import { defineStorage } from '@aws-amplify/backend';


export const storage = defineStorage({
  name: 'evox_processor_storage',
  access: (allow) => ({
    'vehicles/*': [
      allow.authenticated.to(['read','write']),
      allow.guest.to(['read', 'write'])
    ],
    'loras/*': [
      allow.authenticated.to(['read','write']),
      allow.guest.to(['read', 'write'])
    ],
  })
});