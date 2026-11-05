import { defineModule } from '@directus/extensions-sdk';
import Catalog from './catalog.vue';

export default defineModule({
  id: 'blueform-catalog',
  name: 'Товары',
  icon: 'checkroom',
  routes: [{ path: '', component: Catalog }],
});
