# Installation

Follow this guide to install Emporium on your Kubernetes cluster using Helm.

::: danger 

**Disclaimer:** By installing Emporium, you acknowledge and accept that the process and its outcomes are solely your responsibility. Emporium is currently in its alpha stage and may contain bugs. We do not assume liability for any issues, data loss, or other adverse events that may occur. Use at your own risk.
:::

# Install with Emporium CLI
We recommend using the **Emporium CLI** to install Emporium.

Grab the **Emporium CLI** with this command:

```sh
curl https://cli.emporium.build/ | sh
```

Execute **emp install** and follow the instructions:
```sh
➜  ~ emp install   
✨ Cluster detected: supercluster
✗ Is there an existing Authentik instance you wish to integrate with Emporium?: 
What FQDN should be used to access Authentik? (e.g., id.example.org): id.emporium.app
What FQDN should be used for Emporium's access? (e.g., emporium.example.org): emporium.app
Which Kubernetes Namespace do you prefer for installing Emporium? (default: emporium): emporium
⏳ Installing Emporium on cluster supercluster. This might take a few minutes...
✅ Emporium installation complete on supercluster.

Access Emporium:

Emporium URL: https://emporium.app
Authentik Username: akadmin
Authentik Bootstrap Password: Z3i1alwkfU0OaM2PS4YDI42XkdHlYp3ro

The 'akadmin' user is for initial testing only. Create a personal account or configure a social login for production use.
Change the 'akadmin' password immediately after first login.

You might encounter a temporary DNS error as the newly created domain resolves. Please wait a few minutes and try again.
If you see an empty Emporium home screen, the installation is successful!
Follow the Emporium Docs to add repositories: https://emporium.build/docs/guides/configure-repositories.html

```


# Install with Helm Chart

To install Emporium, run the following command. Make sure to replace the hostnames with your own domains.


## Prerequesites
- Make sure you have [helm](https://helm.sh/docs/intro/install/) and [kubectl](https://kubernetes.io/docs/tasks/tools/) installed on your system.
- [Cert manager](https://cert-manager.io/docs/installation/helm/) has to be installed and configured on your cluster. 
- The [CloudNativePG operator](https://cloudnative-pg.io/documentation/current/installation_upgrade/) has to be installed on your cluster. Emporium's database runs as a CloudNativePG cluster. The Emporium CLI installs the operator for you; to install it with Helm, run:

```sh
helm upgrade --install cnpg cloudnative-pg \
  --repo https://cloudnative-pg.github.io/charts \
  --namespace cnpg-system --create-namespace --wait
```

## Create Namespace

While not strictly necessary, it's recommended to create a separate namespace for Emporium.

```sh
kubectl create ns emporium
```


::: info
The complete installation usually takes about 5 minutes.
:::

```sh
helm install emporium emporium -n emporium --repo https://emporium.helm.pkg.emporium.rocks -f - << EOF
panel:
  ingress:
    host: "emporium.build"
releaseChannel: "stable"
identity:
  authentik:
    host: "id.emporium.build"

authentik:
  server:
    ingress:
      hosts:
      - id.emporium.build
      pathType: Prefix
      paths:
      - /
      tls:
      - hosts:
        - id.emporium.build
        secretName: authentik-tls
EOF
```

::: tip Already have an Authentik instance?
By default, the Emporium Helm chart comes bundeled with an Authentik instance for identity management.

If you want to connect to a different Authentik instance, you can disable the included instance by setting `authentik.enabled` to `false`.

Then set the `identity.authentik.host` and `identity.authentik.token` variables.
:::

::: tip Already have a PostgreSQL database?
By default, the Emporium Helm chart deploys a CloudNativePG cluster named `emporium-postgresql` for its database. Its size and storage are configured with the `postgresql.*` values.

To use an existing PostgreSQL database instead, set `postgresql.enabled` to `false` and configure the connection with the `database.postgresql.*` values (`host`, `port`, `database`, `user` and either `password` or `existingSecret` and `existingSecretPasswordKey`). No PostgreSQL extensions are required.
:::

## Verify Installation

After the installation suceeds, Helm will print out the URLs where your fresh Emporium instance will be accessible.

```text {3}
...
Access your freshly installed Emporium via the following URL:
https://[emporium.example.org]
...
```

On visiting this URL you will be greeted by a login page from Authentik. If you get a DNS error, please note that the DNS resolution of the freshly created domain might take some time. Patience is your friend.

For initial testing purposes, you can use the `akadmin` user to log in. Make sure to create your personal user or configure a social login provider for production use.

To get the password for `akadmin`, execute the following command.

```sh
kubectl get secret \
  --namespace emporium \
  -o jsonpath="{.data.AUTHENTIK_BOOTSTRAP_PASSWORD}" \
  emporium-authentik | base64 --decode; echo
```

::: info
It's recommended to change the password of `akadmin` after you logged in for the first time.
:::

Once logged in, you should see an emplty Emporium home screen. If that is the case, you successfully installed Emporium.

Congratulations! :tada:



# Upgrading to CloudNativePG

Earlier Emporium releases ran their database on a custom PostgreSQL image with the [`semver`](https://pgxn.org/dist/semver/) extension, deployed by the Bitnami PostgreSQL chart. Later releases run it on stock PostgreSQL as a CloudNativePG cluster, which the upgrade creates **empty**. Whether you upgrade with Helm or with the in-app system update, back up your data before upgrading and restore it afterwards as described below.

Only the tables holding your configuration are copied: repositories, SMTP configs, DNS zones and the record of applied migrations. The chart catalog is a cache that the indexer rebuilds from your repositories. Don't dump the whole old database: its `chart_versions` table uses the `semver` type, which the new PostgreSQL image doesn't have, so restoring it (or importing it with CloudNativePG's `bootstrap.initdb.import`) fails.

The commands below assume the release `emporium` in the namespace `emporium`.

1. Install the CloudNativePG operator as described in the [prerequisites](#prerequesites).

2. Back up your configuration from the old database:

   ```sh
   kubectl -n emporium exec emporium-postgresql-0 -c postgresql -- \
     env PGPASSWORD="$(kubectl -n emporium get secret emporium-postgresql -o jsonpath='{.data.postgres-password}' | base64 -d)" \
     pg_dump -h 127.0.0.1 -U postgres -d emporium --data-only \
       -t repositories -t smtp_configs -t dns_zones -t migrations \
     > emporium-state.sql
   ```

   Check that `emporium-state.sql` contains a `COPY public.repositories` section with your repositories.

3. Upgrade Emporium, either with the in-app system update or with Helm. With Helm, pass your values explicitly rather than with `--reuse-values`, which would also reuse the old chart's defaults and leave the new database unconfigured:

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

   Do this before running another system update: without the record of applied migrations, the next update would re-run old migrations.

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
If Emporium uses an external database that has the `semver` extension, no data needs to be copied: Emporium converts its tables when it starts. Afterwards you can remove the extension with `DROP EXTENSION semver;`.
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
