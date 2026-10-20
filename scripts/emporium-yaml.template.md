# `emporium.yaml` reference

`emporium.yaml` is the file in a chart that tells Emporium 0.5 what the app needs from the
user, from the cluster and from other apps. It replaces the `@userSupplied` comments and the
integration detection of 0.4. The tables on this page are generated from the JSON Schema
`emporium.build/v1`. `emp chart schema` prints the same schema, and `emp chart lint <chart>` checks a chart
against it and renders it.

::: tip Writing a chart
This page lists every field. For how the fields fit together, how values reach Helm and worked
examples, read the chart author manual (`CHART_AUTHOR_MANUAL.md` in the catalog repository). To convert a
0.4 chart, follow the blueprint [Migrate a chart to `emporium.yaml`](https://github.com/monostream/emporium/blob/main/docs/blueprints/migrate-chart-to-emporium-yaml.md).
:::

Every key is optional except `apiVersion`. A chart also needs `annotations.emporiumVersion: "0.5.0"` in
`Chart.yaml`; without it, or with a lower version, Emporium treats the chart as invalid.
Maps keep their order, which is the order of the install form. A duplicate key is an error.

```yaml
apiVersion: emporium.build/v1
sections: []
inputs: {}
integrations: {}
components: {}
profiles: {}
options: {}
exports: {}
```

## Top level

{{table:top}}

## Sections

{{table:section}}

## Inputs

An input is a value the user can set in the install form. Fields of one input:

{{table:input}}

The value reaches Helm in one of two ways: a `path` sets a values key directly, and
`values.emporium.yaml` can read the value with the function `input "Key"`. A `secret` input is stored in the app Secret
`<app>-emporium-secrets`. On update, an empty secret field keeps the stored value.

## Integrations

An integration asks Emporium to provide something. The `type` decides what and which parameters
apply. Parameters of a type sit next to `type`, `required` and `bind`.

```yaml
integrations:
  web:  { type: ingress, skipPaths: ["/api/*"] }
  db:   { type: postgres, database: app, owner: app, version: "17" }
  data: { type: storage, size: { default: 8Gi, growOnly: true } }
```

Fields of every integration:

{{table:integration}}

### `ingress`

{{table:ingress}}

### `oidc`

{{table:oidc}}

### `smtp`

Takes no parameters. The user chooses an SMTP configuration at install.

### `storage`

{{table:storage}}

### `postgres`

{{table:postgres}}

Not available in 0.5: a custom `image`, `sharedPreloadLibraries`, `roles`, `postInitSQL` and
`superuser`.

### `redis`

{{table:redis}}

### `objectStorage`

{{table:objectStorage}}

### `app`

Connects to another installed app. See [App connections](../guides/app-connections).

{{table:app}}

The outputs of each type (`Hostname`, `SecretName`, `PasswordKey`, ...) are listed in the chart
author manual.

## Components

A component makes a workload editable and countable in the install form and in the footprint
preview. Declare one for every workload that matters.

{{table:component}}

## Profiles

A profile is a named preset. `default` selects the preselected profile. Every other key is a profile:

{{table:profiles}}

## Options

{{table:options}}

## Exports

An export offers a service of this app to other apps. See [App connections](../guides/app-connections)
for how the pieces work together.

{{table:export}}

Rules the schema cannot express are checked by `emp chart lint`: the `grantsPath` list must exist in
`values.yaml`, the chart must render the Service named by `service` with every port, and a profile or
override must not set `grantsPath`.
