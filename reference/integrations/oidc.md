# OIDC Integration

The Emporium OIDC integration allows apps to smoothly integrate into the built-in identity provider of Emporium.
Users can select which user group can log into an app (all authenticated users, only admins or everyone).

## Available Variables

The following variables are available to use within the [`values.emporium.yaml`](../values-emporium-yaml) file.

<!--@include: ./oidc-variables.md-->

## Configuration Flow

During the installation of a OIDC enabled app, Emporium will:

1. Create a new OIDC client in the identity provider for the app.
2. Build the redirect URLs of the app. These consist of all publicly available hostnames of the app combined with the path(s) in the `oidcRedirectPaths` annotation. [Learn more](#redirect-paths).
3. Configure the OIDC client with the redirect URLs.
4. Pass variables like `ClientID` and `ClientSecret` to the [`values.emporium.yaml`](../values-emporium-yaml) file.

::: tip
The OIDC client created is the same that is used by the [DNS integration](./dns).
:::

## Define Redirect Paths {#redirect-paths}

OIDC compatible applications always have a specific path where they want the user to be redirected after having authenticated with the identity provider.

Since this path is specific for every app, it can be specified in the `oidcRedirectPaths` annotation of the helm chart of the app. See the [example below](#example). This is the job of the publisher of an Emporium app. Users usually don't have to worry about it.

## Example {#example}

The publisher of an Emporium app specifies the redirect path in the `Chart.yaml` of the helm chart.

```yaml
# ...
annotations:
  # ...
  # A list of paths, comma separated
  oidcRedirectPaths: /users/auth/openid_connect/callback
```

Then they can use it in [`values.emporium.yaml`](../values-emporium-yaml).

```yaml
# ...
auth:
  oidc:
    clientId: {{ .Emporium.Integrations.OIDC.ClientID }}
    issuer: {{ .Emporium.Integrations.OIDC.Issuer }}
```