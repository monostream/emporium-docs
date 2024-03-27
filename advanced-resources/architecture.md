# Architecture

Emporium is designed around a robust and loosely-coupled microservice architecture. This approach improves security and resilience by compartmentalization. Every service serves a distinct purpose, which drastically simplifies the complexity of the source code of each service, helping with maintainability and bug fixing. Below, we delve into the specifics of each component, their interactions, and the technologies that bring Emporium to life.

## Overview

Emporium's high-level architecture is a constellation of interconnected services, each playing a pivotal role in the system's functionality.

![Architecture overview](../img/architecture.png)

## Radar

Radar, predominantly written in Go, configures, deploys and manages the Glass proxy in front of each ingress of an Emporium app instance. Radar manages this proxy throughout it's whole lifecycle, installing new versions of it and ensuring correct configuration. Under the hood, it uses helm to deploy and manage the proxies.

As a [Kubernetes controller](https://kubernetes.io/docs/concepts/architecture/controller/) it tracks all changes done to ingress objects. Specifically to ones that contain Emporium-specific annotations or finalizers. Finalizers are used to indicate that Emporium has to clean up some resources, before deleting an ingress. For example, Radar adds the `emporium.build/release` finalizer to an ingress, indicating that a Glass proxy was deployed for the given ingress. Now, when that ingress is requested for deletion later in it's lifecycle, Radar will be notified (because the `metadata.deletionTimestamp` field is set on the ingress). It will then uninstall the proxy and all related resources. One that is accomplished, it will remove the finalizer, indicating the ingress can be safely deleted by Kubernetes.

To configure the Glass proxy, Radar fetches the respective Emporium secret for an app. It then uses the OIDC and access configuration found within the secret to deploy the Glass proxy. If a proxy is already deployed, it ensures that the correct configuration is applied using. Because proxy configurations are continuously enforced, Radar will automatically upgrade proxies to new versions or migrate configurations if a new Emporium release is deployed on your cluster. At startup, every ingress on the cluster is passed once through the control-loop of Radar.

![Radar flow chart](../img/architecture.png)

## Shield

Shield, also crafted in Go, prepares applications for usage with the authentication proxy. It acts as a crucial intermediary, ensuring that applications are not only compatible with the proxy but also benefit from enhanced security features. Shield's role is pivotal in maintaining the integrity of the system during the integration of new applications or updates.

## Panel

Panel, developed using TypeScript and Vue, is the user-facing component of Emporium. It's designed with a focus on providing an intuitive and engaging user experience. Panel serves as the gateway for users to interact with Emporium, and its development in a modern JavaScript framework ensures a responsive and dynamic user interface.

## Reception

Reception offers a GraphQL API, facilitating programmatic interactions with Emporium. Written in Go, this component is the backbone for seamless integration with other systems or scripts. Its GraphQL interface allows for efficient and flexible data retrieval, which is essential for various external applications or services that need to communicate with Emporium.