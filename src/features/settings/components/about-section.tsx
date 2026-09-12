import { DescriptionItem, DescriptionList, Section } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
// Read at build time by the bundler, no runtime fetch.
const appConfig = require('../../../../app.json') as { expo: { version: string } };
const rootPackage = require('../../../../package.json') as { dependencies: Record<string, string> };
const expoPackage = require('expo/package.json') as { version: string };

export function AboutSection() {
  const t = useT();
  const beeuiVersion = rootPackage.dependencies['@beemvp/beeui-ui'] ?? 'unknown';
  const expoSdkMajor = expoPackage.version.split('.')[0];

  return (
    <Section title={t('settings.section.about')}>
      <DescriptionList>
        <DescriptionItem label={t('settings.about.appVersion')} value={appConfig.expo.version} />
        <DescriptionItem label={t('settings.about.beeuiVersion')} value={beeuiVersion} />
        <DescriptionItem label={t('settings.about.expoSdk')} value={`SDK ${expoSdkMajor} (${expoPackage.version})`} />
      </DescriptionList>
    </Section>
  );
}
