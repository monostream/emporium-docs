# Overview

The goal of this guide is to walk you through the installation of a homeserver. We're going to install the [k3s](https://k3s.io/) Kubernetes distribution which will be running Emporium.

Below is a detailed list of all the components we're going to install. Note that this is soely an example. You run Emporium on any Kubernetes cluster you want, the only requirement is that you have some sort of an automated TLS / DNS setup. Usually this is done using [Cert Manager](https://cert-manager.io/) and [External DNS](https://kubernetes-sigs.github.io/external-dns/v0.14.0/).

## Components

In the following guide we're going to install a production-ready Kubernetes cluster with these components.

- [Cilium](https://cilium.io/): Kubernetes CNI Plugin
- [MetalLB](https://metallb.universe.tf/): Load Balancer
- [Ingress-NGINX Controller](https://github.com/kubernetes/ingress-nginx): Ingress Controller
- [Cert Manager](https://cert-manager.io/): Certificates management
- [External DNS](https://kubernetes-sigs.github.io/external-dns/v0.14.0/): Automated DNS
- [Longhorn](https://longhorn.io/): Cloud-Native Storage

## Prerequisites

You will need a server running the linux distribution of your choice. We recommend Fedora Server. You can follow the [offical documentation](https://docs.fedoraproject.org/en-US/fedora-server/installation/) to get up and running.


### Hardware

You're free to use what ever hardware you have access to. We're currenlty using [Intel NUX 13 Pro](https://www.intel.com/content/www/us/en/products/sku/233101/intel-nuc-13-pro-kit-nuc13anki7/specifications.html) as our test hardware. This is a reasonable solution for home deployments, thanks to it's small size and reasonable power usage.