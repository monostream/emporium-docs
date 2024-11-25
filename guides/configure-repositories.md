# Configure Repositories

Emporium enables users to distribute pre-configured apps through repositories, essentially Helm registries containing Emporium apps. To create Emporium apps, refer to add your own apps.

## Add a Repository

By default, Emporium installs without repositories. This design choice allows users to customize their Emporium catalog. To add a repository, navigate to Settings --> Repositories, where you can input the URL of your Helm repository and assign it a name. Once added, Emporium begins indexing your repository, with apps appearing individually in the catalog.

::: info Note
Indexing may take up to an hour initially.
:::

## Indexing

Emporium indexes repositories to extract names, icons, descriptions, and other metadata for its database. Indexing duration varies, with larger repositories requiring more time.

## OCI Repositories

Currently, Emporium doesn't support Helm OCI registries due to their limited listing capabilities. For interest in this feature, please submit an issue on our GitHub repository.
