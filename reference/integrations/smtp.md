# Email Integration (SMTP)

::: warning Emporium 0.4 format
This page describes the 0.4 format. Emporium 0.5 does not accept it: the `@userSupplied` comments, `.Emporium.UserSupplied` and the DNS, OIDC, SMTP and Storage template variables are errors. See the [`emporium.yaml` reference](../emporium-yaml) and the blueprint [Migrate a chart to `emporium.yaml`](https://github.com/monostream/emporium/blob/main/docs/blueprints/migrate-chart-to-emporium-yaml.md).
:::

The Emporium SMTP integration allows apps to request SMTP / Email credentials that have to be configured by the user at install time.

## Available Variables

The following variables are available to use within the [`values.emporium.yaml`](../values-emporium-yaml) file.

<!--@include: ./smtp-variables.md-->

## Configuring SMTP

Users can configure SMTP configs within the settings of the Emporium UI.
Credentials configured there can then be selected for apps that request an SMTP configuration.

## Example

The following example shows how the SMTP integration can be used in [`values.emporium.yaml`](../values-emporium-yaml).

```yaml
# ...
smtp:
  enabled: true
  host: {{ .Emporium.Integrations.SMTP.Host }}
  username: {{ .Emporium.Integrations.SMTP.Username | quote }}
  password: {{ .Emporium.Integrations.SMTP.Password | quote }}
  port: {{ .Emporium.Integrations.SMTP.Port | quote }}
  from: {{ .Emporium.Integrations.SMTP.From | quote }}
```

This will result in the following input in the UI.

![Emporium smtp integration](../../img/integration_smtp_ui.png)