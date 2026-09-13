/**
 * The chain scope has to survive a relaunch on native, where storage answers only
 * asynchronously: `getItemSync` is web-only, so a scope read at import would always be the
 * demo chain and an org switch would be forgotten on every launch.
 */
import { ACTIVE_ORG_KEY, activeOrgId, loadActiveOrgId, setActiveOrgId } from '../active-org';
import { getPlatformStorage } from '../persist';
import { DEMO_ORG_ID } from '../seed/org';

describe('active chain scope', () => {
  it('starts on the demo chain while nothing has been read', () => {
    expect(getPlatformStorage().getItemSync).toBeUndefined();
    expect(activeOrgId()).toBe(DEMO_ORG_ID);
  });

  it('resolves the stored chain asynchronously and then keeps it for the process', async () => {
    await getPlatformStorage().setItem(ACTIVE_ORG_KEY, 'chuoi-demo-2');

    await expect(loadActiveOrgId()).resolves.toBe('chuoi-demo-2');
    expect(activeOrgId()).toBe('chuoi-demo-2');

    // A later write is for the next launch, not for this one: half the app addressing one
    // chain's keys and half the other's is the failure this guards.
    setActiveOrgId(DEMO_ORG_ID);
    await expect(loadActiveOrgId()).resolves.toBe('chuoi-demo-2');
    expect(activeOrgId()).toBe('chuoi-demo-2');
    expect(await getPlatformStorage().getItem(ACTIVE_ORG_KEY)).toBe(DEMO_ORG_ID);
  });
});
