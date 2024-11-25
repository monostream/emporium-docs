# Add Your Own Apps

An App is a Helm chart that has been preconfigured with a distinctive [`values.emporium.yaml` file](../reference/values-emporium-yaml).

This file interfaces with Emporium and facilitates dynamic UI rendering based on necessary configuration variables. Here's a comprehensive guide to help you get your app ready for Emporium.

## 1. Helm Chart Creation
Before you begin, ensure you have the Helm CLI installed. Follow the [official documentation](https://helm.sh/docs/intro/install/) to install Helm on your system.

After successfully installing Helm, create a new Helm chart, replacing `<app-name>` with your app's name.

```bash
helm create <app-name>
```

This command will create a new chart in a directory named `<app-name>`. Delete all files within the `<app-name>/templates` directory, as they will not be utilized.

```bash
rm -rf <app-name>/templates/*
```

## 2. Add Dependency

::: info Note
For this tutorial, we're assuming that a Helm chart already exists for the application you wish to add to Emporium. If that's not the case, add your resources to the `/templates` directory as you would with any other chart.
:::

Next, open the `<app-name>/Chart.yaml` file using your preferred text editor and add the following lines.

```yaml Chart.yaml
# ...
dependencies:
- name: <dependeny-name>              # name of the dependency chart
  version: ~1.0.0                     # learn how dependency versions are matched:
                                      # https://helm.sh/docs/helm/helm_dependency
  repository: <helm-repo-url>         # the repository url used for `helm repo add ...`
                                      # can start with https://, http:// or oci://
```

For instance, an app that utilizes the `supabase` chart from the Bitnami chart repository would look like this.

```yaml Chart.yaml
# ...
dependencies:
- name: supabase
  version: ~0.3.6
  repository: oci://registry-1.docker.io/bitnamicharts
```

To download the dependency chart, run the following command.

```bash
helm dependency update .
```

You should now find a `.tgz` file in the `<app-name>/charts/` directory.

Since our app is merely a metadata-wrapper for the dependency and doesn't have its own values, we can replace the contents of `<app-name>/values.yaml` with the following line.


```yaml
<dependency-name>: {} # These values are passed to the dependency
```

## 3. Add `values.emporium.yaml`

Create a new file named `<app-name>/values.emporium.yaml`. This file serves as a template for the values passed into Helm install by Emporium. The file must contain all values required by the dependency chart, and the structure must align with the `values.yaml` file of the dependency chart.

```yaml values.emporium.yaml
<dependency-name>:
  # Some example values. Replace with values required by your dependency.
  enableTLS: true
  logLevel: debug
```

You may also use special template variables provided by Emporium. Check out the [`values.emporium.yaml`](../reference/values-emporium-yaml.md) documentation for the full reference.

Here's an example how an ingress configuration might look like.

```yaml values.emporium.yaml
<dependency-name>:
  # Some example values. Replace with values required by your dependency.
  enableTLS: true
  logLevel: debug
  # Example ingress configuration to access the app at https://my-instance-name.cluster.example.org
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

To provide the best user experience, you may want users to input some of the configuration elements, such as usernames and passwords.

Emporium can render user-friendly input fields for this purpose.

The syntax for allowing users to pass `admin.username` and `admin.password` values to the dependency chart looks like this:

```yaml values.emporium.yaml
<dependency-name>:
  # Some example values. Replace with values required by your dependency.
  enableTLS: true
  logLevel: debug
  # Example ingress configuration to access the app at https://my-instance-name.cluster.example.org
  hosts:
    - host: {{ .Emporium.Name }}.{{ .Emporium.DNSZone }}
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: {{ .Emporium.Name }}-tls
      hosts:
        - {{ .Emporium.Name }}.{{ .Emporium.DNSZone }}

  ## @userSupplied AdminUsername
  ## @label Username
  ## @type string
  ## @description Used to sign in, make sure to remember this

  ## @userSupplied AdminPassword
  ## @label Password
  ## @type string
  ## @description Must be at least 10 characters long
  admin:
    username: {{ .Emporium.UserSupplied.AdminUsername }}
    password: {{ .Emporium.UserSupplied.AdminPassword }}
```
Note the `##` at the beginning. For a full syntax guide, refer to the [`@userSupplied` Syntax](../reference/user-supplied-syntax) documentation.

## 4. Adding Metadata (Optional)

Emporium will render the markdown content found in `<app-name>/README.md` as HTML on the app overview page. This file should serve as an overview page for your app.

Additionally, it will show some metadata defined in `Chart.yaml` file of your chart. The following fields will be rendered in the sidebar of the app overview page.

* `name`
* `description`
* `appVersion`
* `home`
* `icon`
* `sources`
* `maintainers`
* `keywords`
* `annotations.category`
* `annotations.licenses`

To ensure an optimal user experience, we recommend populating these fields.

## 5. Configuring the OIDC Integration

Emporium ships with a powerful OIDC integration. The OIDC protocol will forward users to the identity provider to log in (Authentik in the case of Emporium). After a successful login, users will be redirected back to the application to a so-called callback or redirect URL.

Since redirect URLs are application-specific, you have to tell Emporium where it should redirect your users, after a successful OIDC login. Use the `oidcRedirectPaths` field in the `annotations` of the `Chart.yaml` file for that.

```yaml Chart.yaml
# ...
annotations:
  # ...
  oidcRedirectPaths: /users/auth/openid_connect/callback
```

If you want to allow multiple paths, you can simply separate them by a comma.

## 6. Publishing and Configuration

You're now ready to publish the Helm chart to your Helm repository. Remember to configure Emporium to use that repository. As soon as the chart is published, it will appear in Emporium and your users will be able to install it.

Refer to the [official Helm documentation](https://helm.sh/docs/topics/chart_repository/) to set up a repository and automate chart publication upon changes.
