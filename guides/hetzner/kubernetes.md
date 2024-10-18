# Steps to Set Up a Hetzner Kubernetes Cluster:

This guide sets up a resilient, production-grade Kubernetes cluster with HA, autoscaling, automatic upgrades and an ingress stack.

## Create a Read-Write Hetzner API Token  
   - Go to your Hetzner account and create a token with Read-Write access to manage resources.


## Generate an SSH Key Pair  
   - Run the following command to create a new SSH key pair:
     ```bash
     ssh-keygen -t ed25519
     ```
   - Follow the prompts to save the key.


## Bootstrap the `kube.tf` File  
   - Use this script to create and configure the `kube.tf` Terraform file:
     ```bash
     tmp_script=$(mktemp) && curl -sSL -o "${tmp_script}" https://raw.githubusercontent.com/kube-hetzner/terraform-hcloud-kube-hetzner/master/scripts/create.sh && chmod +x "${tmp_script}" && "${tmp_script}" && rm "${tmp_script}"
     ```


## Modify the `kube.tf` File  
   - Open the generated `kube.tf` and adjust the configurations according to your project's needs (e.g., node sizes, region, etc.). Below is an example configuration for a highly-available (HA) Kubernetes setup.


### Example `kube.tf` for HA Setup  
This configuration defines an HA cluster on Hetzner, using multiple control planes in different data centers for redundancy.

```hcl
locals {
  hcloud_token = ""
}

module "kube-hetzner" {
  providers = {
    hcloud = hcloud
  }
  hcloud_token = var.hcloud_token != "" ? var.hcloud_token : local.hcloud_token

  source = "kube-hetzner/kube-hetzner/hcloud"

  ssh_public_key = file("id_ed25519.pub")
  ssh_private_key = file("id_ed25519")
  network_region = "eu-central" 

  control_plane_nodepools = [
    {
      name        = "control-plane-fsn1",
      server_type = "cx32",
      location    = "fsn1",
      labels      = [],
      taints      = [],
      count       = 1
    },
    {
      name        = "control-plane-nbg1",
      server_type = "cx32",
      location    = "nbg1",
      labels      = [],
      taints      = [],
      count       = 1
    },
    {
      name        = "control-plane-hel1",
      server_type = "cx32",
      location    = "hel1",
      labels      = [],
      taints      = [],
      count       = 1
    }
  ]

  agent_nodepools = [
    {
      name        = "agent-fsn1",
      server_type = "cx32",
      location    = "fsn1",
      labels      = [],
      taints      = [],
      count       = 1
    },
  ]

  autoscaler_nodepools = [
    {
      name        = "autoscaled-cx32",
      server_type = "cx32",
      location    = "nbg1",
      min_nodes   = 1,
      max_nodes   = 3
    }
  ]

  load_balancer_type     = "lb11"
  load_balancer_location = "fsn1"


  control_plane_lb_type = "lb11"
  use_control_plane_lb = true

  system_upgrade_use_drain = true

  cluster_name = "emporium"

  cni_plugin          = "cilium"
  cilium_version      = "1.15.1"
  cilium_routing_mode = "native"
  cilium_hubble_enabled = true
  disable_kube_proxy = true

  ingress_controller = "nginx"

  enable_cert_manager = true
  cert_manager_values = <<EOT
installCRDs: true
nameOverride: cert-manager
fullnameOverride: cert-manager
ingressShim:
  defaultIssuerKind: ClusterIssuer
  defaultIssuerName: letsencrypt-prod
  EOT 

  automatically_upgrade_k3s = true
  automatically_upgrade_os  = true

  dns_servers = [
    "1.1.1.1",
    "8.8.8.8",
    "2606:4700:4700::1111",
  ]
}

provider "hcloud" {
  token = var.hcloud_token != "" ? var.hcloud_token : local.hcloud_token
}

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = ">= 1.43.0"
    }
  }
}

output "kubeconfig" {
  value     = module.kube-hetzner.kubeconfig
  sensitive = true
}

variable "hcloud_token" {
  sensitive = true
  default   = ""
}

```

Explanation:

- Control Plane Setup:  
  The `control_plane_nodepools` define three control-plane nodes in different Hetzner regions (fsn1, nbg1, hel1), providing redundancy and high availability. If one data center goes down, the other control planes can keep the cluster running.

- Autoscaler:  
  The `autoscaler_nodepools` allows the worker nodes to scale automatically based on demand. The configuration allows for a minimum of 1 node and a maximum of 3 nodes in the `fsn1` region.

- Load Balancer:  
  Two lb11 type Hetzner load balancers are deployed in the fsn1 region:
  - One distributes traffic across the control plane nodes.
  - The other manages traffic for the ingress nodes.

- CNI and Ingress Controller:  
  The setup uses `Cilium` as the CNI (Container Networking Interface) plugin, a powerful and scalable networking solution. The `nginx` ingress controller is enabled to handle external traffic, and Cert-Manager is set up to manage TLS certificates for secure communication.

- Automatic Upgrades:  
  Both the Kubernetes components (K3s) and the underlying OS will be automatically upgraded to ensure security and stability.

- DNS Servers:  
  The cluster is configured to use Cloudflare's and Google's public DNS servers, ensuring reliable domain resolution.


## Initialize and Apply Terraform  
   - Initialize your Terraform workspace and apply the changes:
     ```bash
     terraform init --upgrade
     terraform validate
     terraform apply -auto-approve
     ```


## Wait for Cluster Bootstrap  
   - After a few minutes, all components should be fully deployed in your Hetzner project. The `kubeconfig` file will be generated in the same directory as `kube.tf`.



## External DNS

To enable automatic DNS resolution when creating an Ingress in your Kubernetes cluster, you need to install External-DNS and configure Cert-Manager's ClusterIssuer. This guide walks you through setting up External-DNS with Azure DNS and configuring Cert-Manager to use Let's Encrypt for SSL certificates.


### Create a DNS Zone in Azure

Replace `mydomain.com` with your actual domain.

```bash
AZURE_DNS_ZONE_RESOURCE_GROUP="dns-zones"
AZURE_DNS_ZONE="mydomain.com"

az network dns zone create --resource-group $AZURE_DNS_ZONE_RESOURCE_GROUP --name $AZURE_DNS_ZONE
```

### Create a Service Principal (SP) with DNS Zone Contributor Role

```bash
AZURE_CERT_MANAGER_NEW_SP_NAME="dns-zones-manager"
AZURE_DNS_ZONE_RESOURCE_GROUP="dns-zones"
AZURE_DNS_ZONE="mydomain.com"

DNS_SP=$(az ad sp create-for-rbac --name $AZURE_CERT_MANAGER_NEW_SP_NAME --output json)
AZURE_CERT_MANAGER_SP_APP_ID=$(echo $DNS_SP | jq -r '.appId')
AZURE_CERT_MANAGER_SP_PASSWORD=$(echo $DNS_SP | jq -r '.password')
AZURE_TENANT_ID=$(echo $DNS_SP | jq -r '.tenant')
AZURE_SUBSCRIPTION_ID=$(az account show --output json | jq -r '.id')

DNS_ID=$(az network dns zone show --name "mydomain.com" --resource-group "dns-zones" --query "id" --output tsv)
az role assignment create --assignee ${AZURE_CERT_MANAGER_SP_APP_ID} --role "DNS Zone Contributor" --scope $DNS_ID
```

### Create Kubernetes Secret for Azure DNS

```bash
kubectl create secret generic azuredns-config --from-literal=client-secret=${AZURE_CERT_MANAGER_SP_PASSWORD}
```

### Create a values.yaml File

```yaml
nameOverride: external-dns
fullnameOverride: external-dns

crd:
  create: true

policy: sync

sources:
  - crd
  - service
  - ingress

resources:
  requests:
    cpu: 50m
    memory: 64Mi

extraArgs:
  txt-wildcard-replacement: wildcard

service:
  enabled: false

networkPolicy:
  enabled: false

domainFilters:
  - mydomain.com

provider: azure
azure:
  tenantId: "<AZURE_TENANT_ID>"
  subscriptionId: "<AZURE_SUBSCRIPTION_ID>"
  resourceGroup: "dns-zones"
  aadClientId: "<AZURE_CERT_MANAGER_SP_APP_ID>"
  aadClientSecret: "<AZURE_CERT_MANAGER_SP_PASSWORD>"
```

### Install External-DNS

```bash
helm install external-dns bitnami/external-dns \
  --namespace external-dns \
  -f values.yaml
```

### Create ClusterIssuer

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: your-email@example.com  # Replace with your email
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - dns01:
          azureDNS:
            tenantID: "<AZURE_TENANT_ID>"
            subscriptionID: "<AZURE_SUBSCRIPTION_ID>"
            resourceGroupName: "dns-zones"
            hostedZoneName: "mydomain.com"
            clientID: "<AZURE_CERT_MANAGER_SP_APP_ID>"
            clientSecretSecretRef:
              name: azuredns-config
              key: client-secret
            environment: AzurePublicCloud
          selector:
            dnsZones:
              - "mydomain.com"
```
```bash
kubectl apply -f clusterissuer.yaml
```


## Caveats

Because of an existing limitation in upstream Kubernetes, pods cannot talk to other pods via the IP address of an external load-balancer set up through a LoadBalancer-typed service. Kubernetes will cause the LB to be bypassed, potentially breaking workflows that expect TLS termination or proxy protocol handling to be applied consistently.

To resolve this issue, add the following annotation to the Ingress NGINX service:

```yaml
load-balancer.hetzner.cloud/hostname: lb.mydomain.com
```
Ensure you manually create an A record for the `lb` entry within your DNS zone `mydomain.com`. Failing to do so may cause the external-dns and ingress integration to malfunction.