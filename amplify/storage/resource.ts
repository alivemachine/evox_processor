
import { defineStorage } from '@aws-amplify/backend';


export const storage = defineStorage({
  name: 'evox_processor_storage',
  access: (allow) => ({
    '*/*': [
      allow.authenticated.to(['read','write']),
      allow.guest.to(['read', 'write'])
    ],
  })
});