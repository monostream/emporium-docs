# Architecture

Emporium's architecture is a testament to modern software design, leveraging a robust and loosely-coupled structure where each service is developed with a focused responsibility. This approach not only simplifies maintenance but also enhances the scalability and performance of the system. Below, we delve into the specifics of each component, their interactions, and the technologies that bring Emporium to life.

## Overview

Emporium's high-level architecture is a constellation of interconnected services, each playing a pivotal role in the system's functionality.

![Architecture overview](../img/architecture.png)

## Radar

Radar, predominantly written in Go, is the vanguard of Emporium's application security. It employs an authentication proxy to safeguard the apps. This proxy is not just a static barrier but a dynamic entity, managed throughout its lifecycle by Radar.

The process flow of Radar delineates its operational strategy, detailing how it responds to ingress changes, manages the authentication proxy, and interacts with the identity provider. This includes intricate processes like the installation and uninstallation of the proxy, ensuring a seamless integration of security layers.

![Radar flow chart](../img/architecture.png)

## Shield

Shield, also crafted in Go, prepares applications for usage with the authentication proxy. It acts as a crucial intermediary, ensuring that applications are not only compatible with the proxy but also benefit from enhanced security features. Shield's role is pivotal in maintaining the integrity of the system during the integration of new applications or updates.

## Panel

Panel, developed using TypeScript and Vue, is the user-facing component of Emporium. It's designed with a focus on providing an intuitive and engaging user experience. Panel serves as the gateway for users to interact with Emporium, and its development in a modern JavaScript framework ensures a responsive and dynamic user interface.

## Reception

Reception offers a GraphQL API, facilitating programmatic interactions with Emporium. Written in Go, this component is the backbone for seamless integration with other systems or scripts. Its GraphQL interface allows for efficient and flexible data retrieval, which is essential for various external applications or services that need to communicate with Emporium.