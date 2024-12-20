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
