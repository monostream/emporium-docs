# DNS Integration

The Emporium DNS integration allows the user to define the hostname for an app, based on pre-configured domains.

## Available Variables

The following variables are available to use within the [`values.emporium.yaml`](../values-emporium-yaml) file.

<!--@include: ./dns-variables.md-->

## Configuration Flow

During the installation of a DNS enabled app, Emporium will:

1. Identify all internet-facing endpoints of an app.
2. Deploy a [glass instance](#glass) in front of every endpoint.
3. Pass the `Hostname` to the [`values.emporium.yaml`](../values-emporium-yaml) file.

## Glass {#glass}

Glass is the secret hero behind the scenes of Emporium. It's a state of the art layer 7 proxy supporting OIDC authentication and authorization.
Additionally it injects the Emporium Panel overlay into the all apps, enabling you to effortlessly navigate between them.

## Example

Most commonly, the DNS integration is used to configure ingresses as shown in the example below.

::: tip Important
Add `.Emporium.Annotations` to every ingress deployed by your app, to make sure it's properly protected by Glass.
:::

```yaml
ingress:
  enabled: true

  annotations:
    {{- if .Emporium.Annotations }}
    {{- toYaml .Emporium.Annotations | nindent 4 }}
    {{- end }}
    kubernetes.io/tls-acme: "true"

  hosts:
    - host: {{ .Emporium.Integrations.DNS.Hostname }}
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: {{ .Emporium.Name }}-tls
      hosts:
        - {{ .Emporium.Integrations.DNS.Hostname }}
```
