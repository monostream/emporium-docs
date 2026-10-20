# Operating Emporium

What an administrator should know about how Emporium treats Ingresses, namespaces and charts, and what it logs.

## Shield and app ownership

shield is a mutating webhook for Ingresses. It sends the traffic of an app to the app's glass
proxy (the Ingress backend becomes `<ingress>-glass`), but only for Ingresses of apps that this
Emporium installation owns, that is, the same Ingresses radar installs glass for.

- shield only receives Ingresses that carry one of the annotations `emporium.build/app-name`,
  `emporium.build/original-configuration` or `emporium.build/protected-by`, or did before the
  update. Namespaces in `shield.webhook.excludedNamespaces` (default `kube-system`, `kube-public`,
  `kube-node-lease`) are skipped. Both are `matchConditions` of the webhook, which needs
  Kubernetes 1.30. The webhook has no `namespaceSelector`, so an Ingress without these annotations
  never depends on a namespace lookup or on shield. `shield.webhook.failurePolicy` is `Fail`
  and `shield.webhook.timeoutSeconds` 5.
- An Ingress that carries `emporium.build/app-name` but belongs to no app of this installation (no
  app config, a 0.4 config, or not part of the app's Helm release) is admitted unchanged. Only
  the panel's own Ingress is special-cased.
- Each installation writes `emporium.build/protected-by: <namespace>/<release>` (its namespace and
  Helm release) on the Ingresses it sends to glass. The app's config records the same installation id
  (`installation`), and the config, not the stamp, decides ownership. Charts can't set
  the stamp: the post-renderer strips it.
- If shield cannot read an app's config, or finds an unknown config schema, it refuses the Ingress
  instead of admitting it without glass.
- shield needs `SYSTEM_NAMESPACE` and `RELEASE_NAME`; the chart sets them.

Known limits:

- Apps installed by earlier 0.5 release candidates have no recorded installation. Every Emporium
  installation on the cluster counts them as its own. On a cluster with one installation this
  makes no difference.
- With several Emporium installations in one cluster, ownership by installation only keeps apart apps
  that recorded their installation. For an app without one, every radar reconciles glass and the
  stamp goes to whichever shield runs last at creation. TLS replication does not check the
  installation either.
- An Ingress that belongs to no app (the panel, for example) follows its stored stamp. Planting a
  foreign stamp needs edit rights on that Ingress.

## Audit log

reception logs who asked for each app change. Before the work starts it writes one INFO line
`mutation requested` for `installApp`, `updateApp` (including hold and resume and changes of
integration or connection choices), `uninstallApp`, `cleanupFailedInstall`, `migrateApp`,
`createNamespace`, `createPersistentVolumeClaim` and `deletePersistentVolumeClaim`:

```
level=INFO msg="mutation requested" action=uninstall actor.sub=u8k2... actor.username=ada actor.email=ada@example.com actor.client_id=<glass app id> actor.role=admin app=wiki namespace=emp-wiki
```

The actor is taken from the verified access token: the user (`sub`, name, email), the OAuth client the
token was issued to (`client_id`: glass, the CLI or a machine client) and the Emporium role. A token
of a machine-to-machine client shows its client id as `sub`. If the request fails synchronously, a
second line `mutation failed` repeats the fields and adds only a code (a lifecycle error such as
`busy`, `not-found` or `has-consumers`, the codes and fields of an invalid configuration, or
`invalid-input` with the field), never the error text, because error texts can quote settings and
short secrets. The GraphQL error handler logs known errors (parse and validation errors, invalid
input, the lifecycle codes, expected Kubernetes refusals) by code in the same way, and unexpected
errors in full with secrets redacted.

## Charts that are too large

Helm stores each release in a Secret that the API server limits to 1 MiB. Emporium measures the
release record exactly as Helm stores it (chart files including `assets/`, values, manifest, hooks and
notes, compressed) before it stores anything. If the record is over 960 KiB, the install or update fails
with `chart-too-large`, and nothing is changed. `emp chart lint` reports the same as `chart-size`
(an error when the install would refuse the chart, a warning above 683 KiB). Emporium does not
strip files from charts: the chart must be made smaller, by moving large files out of the chart or
listing them in `.helmignore`.

## Catalog

The catalog shows one tile per chart name, even when several repositories offer the chart. The tile
comes from the repository whose chart can be installed by the running Emporium (valid, and its
`emporiumVersion` is satisfied), then the highest version, then the repository that was added first.
Charts that cannot be installed stay visible and are marked "Not installable". Installed apps and updates still look up charts by repository.
Category counts follow the same tiles. The sidebar shows an icon for each category and a
generic tag for categories it does not know.

An installed app's main URL, the link on its tile, is the host of the first `ingress` integration
in the chart's `emporium.yaml` that the app's Ingresses carry. Charts with several Ingresses
(GitLab: web, registry, kas) therefore list the web host first. The GraphQL field `urls` of an
app lists the main URL first.
