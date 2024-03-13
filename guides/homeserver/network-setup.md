# Network notes

Currently just some notes about network installation.


```bash
export NETWORK_NAMESPACE=network-system
```
## Install Metallb

Update IP-Pool in `metallb-pool.yaml`

```yaml
spec:
  addresses:
  - 192.168.1.222/32
```

```bash
helm upgrade --install -n ${NETWORK_NAMESPACE} metallb bitnami/metallb --set fullnameOverride=metallb
kubectl apply -f metallb-pool.yaml -n ${NETWORK_NAMESPACE}
```


## Install Ingress-Nginx

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install -n ${NETWORK_NAMESPACE} ingress ingress-nginx/ingress-nginx -f ingress-values.yaml
```


# Install External DNS, Cert-Manager, Cloudflare DDNS

Stuff needed from Cloudflare:
- Cloudflare Token with edit rights for the zone
- ZoneId
- Email Address

Update:
- cloudflare-ddns.yaml
- cluster-issuer.yaml
- external-dns-vlaues.yaml

```bash
kubectl create secret generic cloudflare-secret --from-literal=cloudflare_api_token=<your-cloudflare-api-key> -n ${NETWORK_NAMESPACE}
```

```bash
helm upgrade --install -n ${NETWORK_NAMESPACE} external-dns bitnami/external-dns -f external-dns-values.yaml
```

```bash
kubectl create secret generic config-cloudflare-ddns --from-file=config.json=cloudflare-ddns-config.json -n ${NETWORK_NAMESPACE}
kubectl apply -f cloudflare-ddns.yaml -n ${NETWORK_NAMESPACE}
```

```bash
helm upgrade --install -n ${NETWORK_NAMESPACE} cert-manager jetstack/cert-manager -f cert-manager-values.yaml
kubectl apply -f cluster-issuer.yaml
```



## Resources:

cert-manager-values.yaml
```yaml
fullnameOverride: cert-manager
installCRDs: true
ingressShim:
  defaultIssuerKind: ClusterIssuer
  defaultIssuerName: letsencrypt-prod
```


cloudflare-ddns-config.json
```json
{
    "cloudflare": [
      {
        "authentication": {
          "api_token": "<INSERT CLOUDFLARE TOKEN>"
        },
        "zone_id": "<INSERT CLOUDFLARE ZONE ID>",
        "subdomains": [
          {
            "name": "dynamic",
            "proxied": false
          }
        ]
      }
    ],
    "a": true,
    "aaaa": true,
    "purgeUnknownRecords": false,
    "ttl": 300
  }
```

cloudflare-ddns.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloudflare-ddns
spec:
  selector:
    matchLabels:
      app: cloudflare-ddns
  template:
    metadata:
      labels:
        app: cloudflare-ddns
    spec:
      containers:
        - name: cloudflare-ddns
          image: timothyjmiller/cloudflare-ddns:latest
          resources:
            limits:
              memory: '32Mi'
              cpu: '50m'
          env:
            - name: CONFIG_PATH
              value: '/etc/cloudflare-ddns/'
          volumeMounts:
            - mountPath: '/etc/cloudflare-ddns'
              name: config-cloudflare-ddns
              readOnly: true
      volumes:
        - name: config-cloudflare-ddns
          secret:
            secretName: config-cloudflare-ddns
```


cluster-issuer.yaml
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: <INSERT EMAIL>
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - dns01:
        cloudflare:
          email: <INSERT EMAIL>
          apiTokenSecretRef:
            name: cloudflare-secret
            key: cloudflare_api_token
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned
spec:
  selfSigned: {}
```


external-dns-values.yaml
```yaml
fullnameOverride: external-dns
crd:
  create: true
sources:
- crd
- service
- ingress
logLevel: debug
policy: sync
registry: txt
# annotationFilter: "external-dns.alpha.kubernetes.io/target"
txtOwnerId: default
provider: cloudflare
cloudflare:
  secretName: cloudflare-secret
  proxied: false
domainFilters:
- emporium.host
resources:
  requests:
    cpu: 50m
    memory: 64Mi
```


ingress-values.yaml
```yaml
nameOverride: ingress-nginx
fullnameOverride: ingress-nginx
controller:
  replicaCount: 3
  resources:
    requests:
      cpu: 10m
      memory: 100Mi
  ingressClassResource:
    name: nginx
    enabled: true
    default: true
    controllerValue: "k8s.io/ingress-nginx"
```

metallb-pool.yaml
```yaml
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default-pool
spec:
  addresses:
  - 192.168.1.222/32
```