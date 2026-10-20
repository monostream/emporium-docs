# Providers

A provider gives apps what their charts declare as integrations: an Ingress with login, a database, a
volume, mail settings and so on. Settings, Providers (admins only) lists them. Each entry shows its health,
how many apps use it and how many resources it manages. Opening one shows its settings, the apps that use
it and its resources.

Providers create objects only for the app that asked for them. Every object carries the app's owner id, and
Emporium reads and verifies the single named object before it changes or deletes it. It never takes over an
object it did not create and never deletes by selector.

| Provider | Creates for an app | Settings | Healthy when |
|---|---|---|---|
| Ingress | Ingress annotations, the OIDC client of the login proxy (glass), TLS Secrets | none editable. The class is the Helm value `providers.ingress.ingressClassName`; DNS zones and global annotations are shown but managed under Domains | Logto answers, the ingress class is usable and every zone's TLS works |
| OIDC | An OIDC client in Logto | none | Logto answers |
| SMTP | Nothing. It hands out an SMTP configuration | none. Configurations live under Settings, Email | always |
| Storage | A PersistentVolumeClaim, or uses an existing one | `defaultStorageClass` (empty: the cluster default), `allowCreate` (off: apps can only use existing claims) | the storage class exists, or the cluster has a default class |
| PostgreSQL | A CloudNativePG cluster `<app>-<integration>` | none | the CloudNativePG operator is installed |
| Redis | A Valkey StatefulSet, Service and volume. No operator | `image`, `defaultStorageClass` | the StatefulSets can be listed and the storage class exists |
| Object storage | A RustFS (S3) StatefulSet, Service and bucket Job | none | the StatefulSets can be listed |
| Apps | Connections between installed apps, see [App connections](./app-connections) | none | apps can be listed |

Settings are stored in Emporium's config Secret. A secret value shows as `***`; saving `***` keeps the stored
value. The PostgreSQL health also reports whether the CloudNativePG `Database` CRD exists. Without it
(CloudNativePG older than 1.26), extensions cannot be added to an existing app database.

## Ingress class

App Ingresses get `spec.ingressClassName` from the ingress provider. The settings of the ingress
provider are read-only in the panel: the class is configured with the Helm value
`providers.ingress.ingressClassName`, which reception reads as `INGRESS_CLASS_NAME`. The class is chosen in
this order:

1. A class stored by an earlier version under Settings, Providers (still honoured). A stored empty value
   counts: it means "use the cluster's default IngressClass".
2. The Helm value `providers.ingress.ingressClassName`. It is never written into the stored settings, so
   changing it takes effect after `helm upgrade`.
3. The name of the cluster's default IngressClass.
4. Empty, when none of these exists. Apps then get no class and the controller's default applies.

Set `providers.ingress.ingressClassName`, for example to `nginx`, when the cluster has no
default IngressClass.

The health check shows two warnings. They do not make the provider unhealthy:

- The chosen class has no IngressClass object. Controllers such as ingress-nginx serve their class name
  without one, so Emporium assumes a controller watches it.
- No class is set and the cluster has no default IngressClass. App Ingresses then get no class. Set the Helm
  value above.

The provider is unhealthy when the IngressClass API call fails, when Logto does not answer, or when a
zone's TLS check fails.

## Zone TLS modes

Each DNS zone (Settings, Providers, Zone TLS) issues TLS certificates in one of two modes.

| Mode | What happens | Needs |
|---|---|---|
| Per host (default) | Each app Ingress carries the zone's ClusterIssuer annotation. cert-manager issues one certificate per host into `<app>-<integration>-tls` | A ClusterIssuer. Leave the issuer field empty to use the zone's default |
| Wildcard | One `*.<zone>` certificate. Emporium creates the Certificate `emporium-wildcard-<zone>` in its namespace, and the Secret is copied into the namespace of every app with an Ingress in the zone | A ClusterIssuer that is Ready and has an ACME DNS-01 solver |

Host names are flat: `<subdomain>.<zone>` and `<subdomain>-<key>.<zone>`. They stay one label below the zone,
so one wildcard certificate covers every host of every app. The first Ingress of an app uses the app name as the
subdomain. Further Ingress integrations of the same app use `<app>-<integration>` unless the installer picks a
subdomain. Two Ingress integrations of one app cannot share a host; the install preview refuses it.

Switching a zone to wildcard is refused while the issuer is not Ready or has no DNS-01 solver. The zone's status
shows the state of the wildcard Certificate. In the provider health, a zone is healthy when its issuer is usable
(per host) or its wildcard Certificate is `Ready` (wildcard).

## Retained data

When you uninstall an app, the dialog offers "Keep data" or "Delete" for every integration that holds data
(storage, PostgreSQL, Redis, object storage). "Keep data" is preselected. With it, nothing is deleted. The
provider marks the object as retained and records which app it came from and when. Retained objects appear in
the provider's resource list with the filter "retained". A retained PostgreSQL cluster keeps running, so you can
still dump it. Redis and object storage also keep their credentials in the Secret `<app>-<integration>-retained`.
The namespace stays.

Emporium never adopts retained data automatically. Installing an app whose integration would create an object
under the name of retained data is refused ("retained-data") until an admin deletes the retained
object in the provider's resource list. Only retained objects that Emporium can verify as its own can be
deleted there; objects of a running app cannot. A `storage` integration is the exception: it can reuse a
retained PersistentVolumeClaim of its namespace on purpose, by naming it as `existingClaim`. For the other
types, dump the data first, delete the retained object, reinstall and restore the dump. Or install under a
different app name and restore from the retained object.

An uninstall that was interrupted keeps the choices it started with. Until it is finished again, the app
accepts nothing but the uninstall.

## API

Admins can do the same through the GraphQL API: `providers`, `provider(type)` and `providerResources(type,
retainedOnly)` read; `updateProviderSettings` and `deleteProviderResource` change; `dnsZones` and
`updateDNSZoneTLS(zone, mode, clusterIssuer)` handle zones. `uninstallApp(instanceId, dataPolicies)` takes a
policy, `DELETE` or `RETAIN_DATA`, per integration. Without a policy the API deletes; only the panel preselects
"Keep data".
