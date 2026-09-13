import type { Register } from '../../domain/types';
import { DEMO_ORG_ID } from './org';
import { stores } from './stores';

/**
 * Two tills per store. The session binds to one after the store is picked, so the shift, the
 * cash drawer and the receipt all name the station the sale was rung up on.
 */
export const registers: Register[] = stores.flatMap((store) =>
  [1, 2].map((index) => ({
    id: `${store.id}-reg-${index}`,
    orgId: DEMO_ORG_ID,
    storeId: store.id,
    code: `Q${index}`,
    name: `Quầy ${index}`,
    isActive: true,
  })),
);
