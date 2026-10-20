import { withMermaid } from 'vitepress-plugin-mermaid';

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: 'Emporium Docs',
  description: 'A user-friendly, self-hosted platform that lets you deploy pre-configured apps and services in a snap.',
  base: '/docs/',
  // scripts/ holds the page generators and their templates, not pages.
  srcExclude: ['scripts/**'],
  // head entries are not base-aware, so the icon path carries /docs/ itself.
  head: [['link', { rel: 'icon', href: '/docs/favicon.ico' }]],
  sitemap: {
    hostname: 'https://emporium.build/docs/'
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: 'Emporium',
    logo: '/icon.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/getting-started/overview' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/getting-started/overview' },
          { text: 'Installation', link: '/getting-started/installation' },
          { text: 'Emporium CLI', link: '/getting-started/emporium-cli' },
          { text: 'Screenshots', link: '/getting-started/screenshots' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'emporium.yaml', link: '/reference/emporium-yaml' },
          { text: 'values.emporium.yaml File (0.4)', link: '/reference/values-emporium-yaml' },
          { text: '@userSupplied Syntax (0.4)', link: '/reference/user-supplied-syntax' },
          {
            text: 'Integrations (0.4)',
            collapsed: true,
            items: [
              { text: 'DNS', link: '/reference/integrations/dns' },
              { text: 'OIDC', link: '/reference/integrations/oidc' },
              { text: 'Storage', link: '/reference/integrations/storage' },
              { text: 'Email / SMTP', link: '/reference/integrations/smtp' },
            ],
          },
        ]
      },
      {
        text: 'Guides',
        items: [
          { text: 'Providers', link: '/guides/providers' },
          { text: 'App Connections', link: '/guides/app-connections' },
          { text: 'Operating Emporium', link: '/guides/operating' },
          { text: 'Migrate to 0.5', link: '/guides/migrate-to-0-5' },
          { text: 'Configure Repositories', link: '/guides/configure-repositories' },
          { text: 'Add Your Own Apps (0.4)', link: '/guides/add-your-own-apps' },
          { text: 'Configure Login Providers', link: '/guides/configuring-login-providers' },
          {
            text: 'Homeserver Setup',
            collapsed: true,
            items: [
              {
                text: 'Overview',
                link: '/guides/homeserver/overview'
              },
              {
                text: 'Kubernetes intro',
                link: '/guides/homeserver/kubernetes'
              },
              {
                text: 'Initial Setup',
                link: '/guides/homeserver/k3s-installation'
              },
              {
                text: 'Networking',
                link: '/guides/homeserver/network-setup'
              },
              {
                text: 'Storage',
                link: '/guides/homeserver/storage/storage',
                collapsed: true,
                items: [
                  {
                    text: 'Longhorn',
                    link: '/guides/homeserver/storage/storage-longhorn'
                  },
                  {
                    text: 'Local-Path',
                    link: '/guides/homeserver/storage/storage-localpath'
                  },
                  {
                    text: 'Jucie FS',
                    link: '/guides/homeserver/storage/storage-juicefs'
                  }
                ]
              },
              {
                text: 'GPU Support',
                items: [
                  {
                    text: 'NVIDIA',
                    link: '/guides/homeserver/nvidia-gpu-node'
                  },
                ]
              },
              {
                text: 'KVM Switch',
                link: '/guides/homeserver/kvm-switch'
              },
            ]
          },
          { text: 'Hetzner Kubernetes', link: '/guides/hetzner/kubernetes' },
          { text: 'Catalog', collapsed: true, items: [
            { text: 'Overview', link: '/guides/catalog/overview' },
          ]}
        ]
      },
      {
        text: 'Advanced Resources',
        items: [
          { text: 'Architecture', link: '/advanced-resources/architecture' }
        ],
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/monostream/emporium' }
    ],

    search: {
      provider: 'local'
    }
  }
})
