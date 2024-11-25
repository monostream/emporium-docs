# Overview

The goal of this guide is to walk you through the installation of a home server. We're going to install the [k3s](https://k3s.io/) Kubernetes distribution which will be running Emporium.

Below is a detailed list of all the components we're going to install. Note that this is solely an example. You run Emporium on any Kubernetes cluster you want, the only requirement is that you have some sort of automated TLS / DNS setup. Usually this is done using [Cert Manager](https://cert-manager.io/) and [External DNS](https://kubernetes-sigs.github.io/external-dns/v0.14.0/).

## Components

In the following guide we're going to install a production-ready Kubernetes cluster with these components.

- [Cilium](https://cilium.io/): Kubernetes CNI Plugin
- [MetalLB](https://metallb.universe.tf/): Load Balancer
- [Ingress-NGINX Controller](https://github.com/kubernetes/ingress-nginx): Ingress Controller
- [Cert Manager](https://cert-manager.io/): Certificates management
- [External DNS](https://kubernetes-sigs.github.io/external-dns/v0.14.0/): Automated DNS
- [Longhorn](https://longhorn.io/): Cloud-Native Storage

## Prerequisites

You will need a server running the linux distribution of your choice. We recommend Fedora Server. You can follow the [official documentation](https://docs.fedoraproject.org/en-US/fedora-server/installation/) to get up and running.


### Hardware

You're free to use what ever hardware you have access to. We're currently using [Intel NUC 13 Pro](https://www.asus.com/displays-desktops/nucs/nuc-mini-pcs/asus-nuc-13-pro/) as our test hardware. This is a reasonable solution for home deployments, thanks to its small size and reasonable power usage.