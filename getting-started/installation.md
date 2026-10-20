# Installation

Follow this guide to install Emporium 0.5 on your Kubernetes cluster.

::: danger 

**Disclaimer:** By installing Emporium, you acknowledge and accept that the process and its outcomes are solely your responsibility. Emporium is currently in its alpha stage and may contain bugs. We do not assume liability for any issues, data loss, or other adverse events that may occur. Use at your own risk.
:::

## Prerequisites

| Prerequisite | Why |
|---|---|
| Kubernetes 1.30 or newer with an ingress controller | Apps and the Emporium panel are exposed through Ingresses |
| [cert-manager](https://cert-manager.io/docs/installation/helm/) with a ClusterIssuer | TLS certificates. Wildcard certificates need an issuer with a DNS-01 solver, see [Zone TLS modes](../guides/providers#zone-tls-modes) |
| [CloudNativePG](https://cloudnative-pg.io/documentation/current/installation_upgrade/) operator | Emporium's own database and the PostgreSQL databases of apps. Version 1.26 or newer is needed to add extensions to an existing app database |
| A dedicated [Logto](https://logto.io/) (OSS 1.45 or newer) | Identity provider for the panel and for the apps |
| [helm](https://helm.sh/docs/intro/install/) and [kubectl](https://kubernetes.io/docs/tasks/tools/) | Installing and inspecting |

The Emporium CLI offers to install cert-manager and the CloudNativePG operator when they are missing.
Logto is never installed by Emporium. Use a Logto that serves only Emporium: Emporium owns part of its
tenant-wide configuration.

To install the operator with Helm:

```sh
helm upgrade --install cnpg cloudnative-pg \
  --repo https://cloudnative-pg.github.io/charts \
  --namespace cnpg-system --create-namespace --wait
```

### Set up Logto

1. Install Logto and make its endpoint (for example `https://id.example.com`) reachable over HTTPS by
   browsers and by the cluster. The OIDC issuer is `<endpoint>/oidc`.
2. In the Logto admin console, create a **Machine-to-machine** application (for example `emporium`)
   and assign it the role **Logto Management API access**.
3. Store its credentials in a Secret in Emporium's namespace:

   ```sh
   kubectl create namespace emporium
   kubectl -n emporium create secret generic emporium-logto \
     --from-literal=LOGTO_ENDPOINT=https://id.example.com \
     --from-literal=LOGTO_M2M_APP_ID=<app id> \
     --from-literal=LOGTO_M2M_APP_SECRET=<app secret>
   ```

On every start, Emporium brings Logto to its baseline: an API resource with the scopes `user` and
`admin`, the roles `emporium-user` (the default role of every new user) and `emporium-admin`, a claims
script for access tokens, and sign-in only mode. Self sign-up is switched off, so you create users in the
Logto console. Assign `emporium-admin` to the users who manage Emporium.

## Install with the Emporium CLI

Get the CLI and run the installer:

```sh
curl https://cli.emporium.build/ | sh
emp install
```

`emp install` checks the cluster, offers to install missing prerequisites, checks that the Logto Secret
works, asks for the hostname of Emporium, the DNS zone for apps and the namespace (default `emporium`),
and installs the Helm chart. Pass `--logto-secret` or `--logto-endpoint` if your Secret has another name or
lacks the endpoint.

## Install with Helm

Replace the host names with your own.

```sh
helm install emporium emporium -n emporium --repo https://emporium.helm.pkg.emporium.rocks -f - << EOF
initialDnsZone: "example.com"
panel:
  ingress:
    host: "emporium.example.com"
releaseChannel: "stable"
EOF
```

`initialDnsZone` and `panel.ingress.host` are required. The chart does not install any prerequisite. To
pick the ingress class of app Ingresses, see [Providers](../guides/providers#ingress-class).

::: info
The complete installation usually takes about 5 minutes.
:::

::: tip Already have a PostgreSQL database?
By default, the Emporium Helm chart deploys a CloudNativePG cluster named `emporium-postgresql` for its database. Its size and storage are configured with the `postgresql.*` values.

To use an existing PostgreSQL database instead, set `postgresql.enabled` to `false` and configure the connection with the `database.postgresql.*` values. No PostgreSQL extensions are required.

```yaml
postgresql:
  enabled: false
database:
  postgresql:
    host: "postgres.example.org"
    port: 5432
    database: "emporium"
    user: "emporium"
    password: "<password>"
    # Must be empty for password to take effect, otherwise the password is
    # read from this secret (by default the chart's own credentials secret).
    existingSecret: ""
```

To read the password from a secret instead, leave `password` empty, set `existingSecret` to the secret's name and `existingSecretPasswordKey` to the key holding the password (default `password`).
:::

## Verify Installation

After the installation succeeds, Helm prints the URL of your Emporium.

```text {3}
...
Access your freshly installed Emporium via the following URL:
https://[emporium.example.org]
...
```

Open it. You are sent to Logto to sign in. If you get a DNS error, the new domain may still be
resolving; wait a few minutes. A user needs the role `emporium-user` to open the panel and `emporium-admin`
to see the settings. New users get the first role automatically; assign the second one in the Logto console.

Open Settings, Providers. Every provider should be healthy. A red provider names the missing prerequisite,
for example the CloudNativePG operator. See [Providers](../guides/providers).

Add a repository next: [Configure Repositories](../guides/configure-repositories).

Coming from 0.4? Apps installed by 0.4 are not updated. See [Migrate to 0.5](../guides/migrate-to-0-5).


# Upgrading to CloudNativePG

Earlier Emporium releases ran their database on a custom PostgreSQL image with the [`semver`](https://pgxn.org/dist/semver/) extension, deployed by the Bitnami PostgreSQL chart. Later releases run it on stock PostgreSQL 18 as a CloudNativePG cluster, which the upgrade creates **empty**. Back up your data before upgrading and restore it afterwards as described below.

::: warning Use Helm for this upgrade
Upgrade to a CloudNativePG-based release with `helm upgrade` as shown below. Don't use the in-app system update for it: the updater stays connected to the old database, which the upgrade removes, and fails.
:::

Only the tables holding your configuration are copied: repositories, SMTP configs, DNS zones and the record of applied migrations. The chart catalog is a cache that the indexer rebuilds from your repositories. Don't dump the whole old database: its `chart_versions` table uses the `semver` type, which the new PostgreSQL image doesn't have, so restoring it (or importing it with CloudNativePG's `bootstrap.initdb.import`) fails.

The commands below assume the release `emporium` in the namespace `emporium`.

1. Install the CloudNativePG operator as described in the [prerequisites](#prerequisites).

2. Back up your configuration from the old database:

   ```sh
   kubectl -n emporium exec emporium-postgresql-0 -c postgresql -- \
     env PGPASSWORD="$(kubectl -n emporium get secret emporium-postgresql -o jsonpath='{.data.postgres-password}' | base64 -d)" \
     pg_dump -h 127.0.0.1 -U postgres -d emporium --data-only \
       -t repositories -t smtp_configs -t dns_zones -t migrations \
     > emporium-state.sql
   ```

   Check that `emporium-state.sql` contains a `COPY public.repositories` section with your repositories.

3. Upgrade Emporium with Helm (not with the in-app system update). Pass your values explicitly rather than with `--reuse-values`, which would also reuse the old chart's defaults and leave the new database unconfigured:

   ```sh
   helm get values emporium -n emporium -o yaml > emporium-values.yaml
   helm upgrade emporium emporium -n emporium \
     --repo https://emporium.helm.pkg.emporium.rocks -f emporium-values.yaml
   ```

   Values under `emporium-postgresql` no longer have an effect; configure the new database with `postgresql.*` instead. Remove any `database.postgresql` overrides unless you use an external database.

4. Wait until the database is ready and Emporium has created its tables:

   ```sh
   kubectl -n emporium wait cluster/emporium-postgresql --for=condition=Ready --timeout=10m
   kubectl -n emporium rollout status deployment/emporium-reception
   ```

5. Restore your configuration into the new database, replacing the empty rows Emporium created:

   ```sh
   PRIMARY=$(kubectl -n emporium get pod -o name \
     -l cnpg.io/cluster=emporium-postgresql,cnpg.io/instanceRole=primary)
   { echo 'TRUNCATE repositories, smtp_configs, dns_zones, migrations CASCADE;'; cat emporium-state.sql; } \
     | kubectl -n emporium exec -i "$PRIMARY" -c postgres -- \
       psql -d emporium -v ON_ERROR_STOP=1 --single-transaction
   ```

   Do this before running a system update: without the record of applied migrations, the next update would re-run old migrations.

6. Restart Emporium so the indexer re-imports the charts of your repositories:

   ```sh
   kubectl -n emporium rollout restart deployment/emporium-indexer deployment/emporium-reception
   ```

7. Once everything works, delete the old database's volume and credentials. Until then, `helm rollback` brings back the old database with its data.

   ```sh
   kubectl -n emporium delete pvc data-emporium-postgresql-0
   kubectl -n emporium delete secret emporium-postgresql
   ```

::: info External databases
If Emporium uses an external database, no data needs to be copied: Emporium converts its tables when it starts. Upgrade with `helm upgrade` as in step 3 and add the following to `emporium-values.yaml` so Emporium keeps using your database. Previous releases connected as `postgres` and read the password from the `postgres-password` key, while the new defaults are `emporium` and `password`:

```yaml
postgresql:
  enabled: false
database:
  postgresql:
    host: "<your database host>"
    user: "postgres"
    existingSecret: "<your secret, previously emporium-postgresql by default>"
    existingSecretPasswordKey: "postgres-password"
```

Keep any other `database.postgresql` values you had set. Afterwards you can remove the `semver` extension with `DROP EXTENSION semver;`.
:::

# Uninstallation

Follow these steps to properly uninstall Emporium and all installed apps from your cluster.

## Uninstalls Apps

As the first step, make sure to uninstall all apps via Emporium UI before proceeding. Installed apps won't be automatically removed upon Emporium's uninstallation.

## Helm Uninstall

Run the following command to uninstall Emporium.

```sh
helm uninstall emporium -n emporium
```

::: info
Make sure you replace the Helm release name and namespace with values matching your installation.
:::

To completely get rid of all resources created by the Emporium Helm chart, it's recommended to delete the corresponding namespace. You can do that by running the following command.

```sh
kubectl delete ns emporium
```
