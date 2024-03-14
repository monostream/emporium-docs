# Empporium CLI

The **Emporium CLI** provides a suite of tools to enhance interaction a emporium instance and application lifecycle of emporium Apps:

## Installation
- **Emporium Setup:** Install Emporium on your Kubernetes cluster.
- **Cluster Status:** View the status of your Empporium cluster.
- **Local Tools:** Install necessary Kubernetes tools locally (kubectl, helm, git, etc.).

## Emporium App Lifecycle Management
- **Check and Update Dependencies:** Easily check and update dependencies. Can be integrated with build pipelines for automatic application updates.
- **Scaffold Apps:** Assists in getting started with your custom emporium applications.

## Cluster Operations & Development
- **Catapult:** Proxy services within the cluster.
- **Debug-Node:** Launch a pod on a specified node with full access to host namespaces and filesystem.
- **Tunnel:** Establish a network tunnel within the cluster (default: 10.0.0.0/8).



## Installation

On Linux and macOS it can be installed with the following command.





## Installation

### Linux, macOS & WSL 
Install the CLI with the following command:

```bash
curl https://cli.emporium.build/ | sh
```

Installation with homebrew and chocolatery is planned, but not available yet.

### Windows
For most cases, using WSL2 is recommended.

To use with cmd, PowerShell, or the new Terminal, download the Windows native version:

[Windows AMD64 Download](https://cli.emporium.build/bin/windows/amd64/emp.exe)

After downloading, add the installation directory to your PATH Environment variable for seamless integration.

### All Versions
- [Linux AMD64](https://cli.emporium.build/bin/linux/amd64/emp)
- [Linux ARM](https://cli.emporium.build/bin/linux/arm64/emp)
- [macOS Apple Silicon](https://cli.emporium.build/bin/darwin/arm64/emp)
- [macOS Intel](https://cli.emporium.build/bin/darwin/amd64/emp)
- [Windows AMD64 Download](https://cli.emporium.build/bin/windows/amd64/emp.exe)
