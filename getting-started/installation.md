# Installation

Follow this guide to install Emporium on your Kubernetes cluster using helm.

## Prerequesites
- Make sure you have [helm](https://helm.sh/docs/intro/install/) and [kubectl](https://kubernetes.io/docs/tasks/tools/) installed on your system.
- [Cert manager](https://cert-manager.io/docs/installation/helm/) has to be installed and configured on your cluster. Make sure that the selfsigned ClusterIssuer is present.
```sh
kubectl apply -f - << EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned
spec:
  selfSigned: {}
EOF
```

## Create Namespace

While not strictly necessary, it's recommended to create a separate namespace for Emporium.

```sh
kubectl create ns emporium
```


# Install with emp cli
We recommend using the **emp cli** to install Emporium.

Grab the **emp cli** with this command:

```sh
curl https://cli.emporium.build/ | sh
```

Execute **emp install** and follow the instructions:
```sh
➜  ~ emp install   
✨ Cluster detected: supercluster
✨ Selfsigned Cert Manager Issuer successfully applied
✗ Is there an existing Authentik instance you wish to integrate with Emporium?: 
What FQDN should be used to access Authentik? (e.g., id.example.org): id.emporium.hair
What FQDN should be used for Emporium's access? (e.g., emporium.example.org): emporium.hair
Which Kubernetes Namespace do you prefer for installing Emporium? (default: emporium): emporium
Which Kubernetes Namespace do you prefer for installing Emporium? (default: emporium): emporium
⏳ Installing Emporium on cluster supercluster. This might take a few minutes...
✅ Emporium installation complete on supercluster.

Access Emporium:

Emporium URL: https://emporium.hair
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

::: info
The complete installation usually takes about 5 minutes.
:::

```sh
helm install emporium emporium -n emporium --repo https://emporium.helm.pkg.emporium.rocks  -f - << EOF
panel:
  ingress:
    host: "emporium.example.org"

identity:
  authentik:
    host: "id.example.org"

authentik:
  ingress:
    hosts:
    - host: "id.example.org"
      paths:
      - path: /
        pathType: Prefix
    tls:
    - hosts:
      - "id.example.org"
      secretName: authentik-tls
EOF
```

::: tip Already have an Authentik instance?
By default, the Emporium helm chart comes bundeled with an Authentik instance for identity management.

If you want to connect to a different Authentik instance, you can disable the included instance by setting `authentik.enabled` to `false`.

Then set the `identity.authentik.hostname` and `identity.authentik.token` variables.
:::

## Verify Installation

After the installation suceeds, helm will print out the URLs where your fresh Emporium instance will be accessible.

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