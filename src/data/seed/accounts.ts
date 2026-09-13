import type { UserAccount } from '../../domain/types';
import { sha256Hex } from '../../domain/auth';
import { DEMO_EMAIL_DOMAIN, DEMO_ORG_ID } from './org';
import { staff } from './staff';

/**
 * The demo password every seeded account signs in with. Not a secret: it is printed in the
 * README and on the login screen's hint, and the prototype ships no real data to protect.
 */
export const DEMO_PASSWORD = 'BeePOS@2026';

/** Local part of each seeded email; the owner keeps `owner@` since the README points at it. */
const LOCAL_PART: Record<string, string> = {
  'staff-1': 'owner',
  'staff-2': 'binh',
  'staff-3': 'cuong',
  'staff-4': 'dung',
  'staff-5': 'em',
  'staff-6': 'giang',
  'staff-7': 'hai',
  'staff-8': 'hoa',
  'staff-9': 'khoa',
  'staff-10': 'lan',
  'staff-11': 'minh',
  'staff-12': 'nga',
};

/** Deterministic per-account salt, so the precomputed hashes below stay reproducible. */
export function seedSalt(staffId: string): string {
  return sha256Hex(`beepos-seed-salt:${staffId}`).slice(0, 32);
}

/**
 * `hashPassword(DEMO_PASSWORD, seedSalt(id))` for each account, precomputed.
 *
 * The hash is 10 000 stretching rounds, about 70 ms each: computing twelve of them at import
 * time would add most of a second to every cold boot, so they are constants and a unit test
 * (`src/domain/__tests__/auth.test.ts`) proves they still match the hashing code. Regenerate
 * after changing the password, the salt or the round count with:
 *
 *   npx tsc src/domain/auth.ts --ignoreConfig --outDir /tmp/beepos-hash --module commonjs \
 *     --target es2020 --skipLibCheck
 *   node -e "const a=require('/tmp/beepos-hash/auth.js');for(const id of [...])\
 *     console.log(id, a.hashPasswordSync('BeePOS@2026', a.sha256Hex('beepos-seed-salt:'+id).slice(0,32)))"
 */
const SEED_HASH: Record<string, string> = {
  'staff-1': '0466f5bb53669bffc9b4257153cc2f7e0413ff0be1b9f96889a5e2901c5147dd',
  'staff-2': '61d76eb18d3ef33e2a9262c2757a9d8d193bd0d67fb2d78e309a5a2ead58eeb3',
  'staff-3': '41440125cb0dc5befdfd279ffbce36a6d327f5c78de7dc341be0c248631877b4',
  'staff-4': 'b1742fc0daa6d796c6cd2f4fcdadc67e093256e3a26b523283165215a64b2b69',
  'staff-5': '0bcac0a699b1b3c4cd7e39ee9e3f2a6051a97a49fbfb52327ed0ae4645d4d5d0',
  'staff-6': '3350a7adc042d4040ffd7cfc696370b1654f49906ce50445cca469792a7f9c76',
  'staff-7': '18b46735959aa52031816546e794be9809ceb33c2b5811312b8be05e35e955dc',
  'staff-8': 'a6d4a7dccbc4c017d913e14e853dcac9bdf8ca4e899c5fc84fc181292dcffc6f',
  'staff-9': 'f9b63530a2360b1c28c6dd3655fd557e053814b7c55f097313129eead5638702',
  'staff-10': '712a307a43eb2672a50237c7de86d0783ad98a1bd63b8fad265721ea4854841b',
  'staff-11': 'b76d7d49c18b4a11db328c943902e6ba3846c16a2c5f2a63f9e5813bd361c8d0',
  'staff-12': 'cb54d454d40675249f840dd10a7ef69c453012a22f90f49ad27a2d4124d0a2e8',
};

const CREATED_AT = new Date('2026-01-05T00:00:00.000Z');

/**
 * One sign-in account per staff member. `staff-12` is left `invited`: the staff list needs a
 * member in every state for its status badges to be worth anything, and an invited account is
 * the one state a screenshot cannot fake.
 */
export const accounts: UserAccount[] = staff.map((member) => {
  const invited = member.id === 'staff-12';
  return {
    id: `account-${member.id}`,
    orgId: DEMO_ORG_ID,
    email: `${LOCAL_PART[member.id] ?? member.id}@${DEMO_EMAIL_DOMAIN}`,
    passwordHash: SEED_HASH[member.id],
    salt: seedSalt(member.id),
    staffId: member.id,
    status: invited ? 'invited' : 'active',
    mustChangePassword: invited,
    createdAt: CREATED_AT,
  };
});
