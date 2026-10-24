import { defineRoutesSetup } from '@slidev/types'

export default defineRoutesSetup(routes => [
  ...routes,
  {
    path: '/read',
    name: 'read',
    component: () => import('../pages/reading.vue'),
  },
])
