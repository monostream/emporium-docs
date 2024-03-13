import { withMermaid } from 'vitepress-plugin-mermaid';

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: 'Emporium Docs',
  description: 'A user-friendly, self-hosted platform that lets you deploy pre-configured apps and services in a snap.',
  base: '/docs/',
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
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
          { text: 'Configure Login Providers', link: '/getting-started/configuring-login-providers' },
          { text: 'Screenshots', link: '/getting-started/screenshots' },
          { text: 'Uninstallation', link: '/getting-started/uninstallation' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'values.emporium.yaml File', link: '/reference/values-emporium-yaml' },
          { text: '@userSupplied Syntax', link: '/reference/user-supplied-syntax' },
          {
            text: 'Integrations',
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
          { text: 'Configure Repositories', link: '/guides/configure-repositories' },
          { text: 'Add Your Own Apps', link: '/guides/add-your-own-apps' },
          {
            text: 'Homeserver Setup',
            collapsed: true,
            items: [
              {
                text: 'Overview',
                link: '/guides/homeserver/overview'
              },
              {
                text: 'Initial Setup',
                link: '/guides/homeserver/initial-setup'
              },
              {
                text: 'Networking',
                link: '/guides/homeserver/network-setup'
              },
              {
                text: 'Storage',
                link: '/guides/homeserver/storage',
                collapsed: true,
                items: [
                  {
                    text: 'Longhorn',
                    link: '/guides/homeserver/storage-longhorn'
                  },
                  {
                    text: 'Local-Path',
                    link: '/guides/homeserver/storage-localpath'
                  },
                  {
                    text: 'Jucie FS',
                    link: '/guides/homeserver/storage-juicefs'
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
            ]
          },
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
