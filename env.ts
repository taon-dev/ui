import type { EnvOptions } from 'tnp/src';

const env: Partial<EnvOptions> = {
  website: { domain: 'ui.example.domain.com', title: 'Ui', useDomain: true },
  loading: {
    preAngularBootstrap: {
      background: '#fdebed',
      loader: { name: 'lds-default' },
    },
  },
};
export default env;
