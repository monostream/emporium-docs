# NVIDIA GPU Node

This document outlines the process of enabling your k3s cluster to schedule GPU workloads and explains how to add a node with an Nvidia consumer graphics card.

Nvidia provides a Kubernetes operator known as **NVIDIA GPU Operator** for this purpose. To ensure a Kubernetes cluster can execute GPU workloads, the following stack must be installed:
- NVIDIA Drivers (to enable CUDA)
- CUDA
- Container Toolkit (for executing CUDA workloads in the container engine, containerd in our case)
- Kubernetes Device Plugin

In theory, the GPU Operator should manage all these tasks. However, at the time of writing, consumer graphics cards (such as the RTX 4080, RTX 4090, RTX 3090) are not supported by the operator. Consequently, the driver must be installed directly on the machine.
If you have access to a professional card, you might be able to bypass this step and proceed directly to the 'Install Operator' section.



# Install the Node

1. Install Linux on the node. It's advisable to allocate a larger system partition due to the significant space requirements of the CUDA framework (approximately 7.5GB). Therefore, aim for a minimum of 32GB.

2. If you already have an existing cluster, it is recommended not to join the new node immediately.

3. In cases where you have an encrypted partition, consider enrolling the keys after the driver installation.



## Install nvidia driver

1. Update the system to mitigate potential conflicts between the graphics driver and the system. This step is crucial for maintaining system stability.

2. Add the Nvidia repository to your system sources. This ensures access to the latest Nvidia drivers and related software.

3. Install necessary dependencies and the Nvidia driver. These installations are vital for the proper functioning of your graphics hardware.

4. Reboot the machine to apply changes and ensure the driver is properly integrated with the system.


Check for newer repository versions. At the time of writing, Fedora 39 is the most current release, and the Nvidia repository has been updated to reflect this version.


```bash
sudo dnf upgrade --refresh -y
sudo dnf config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/fedora39/x86_64/cuda-fedora39.repo
sudo dnf install -y kernel-headers kernel-devel tar bzip2 make automake gcc gcc-c++ pciutils elfutils-libelf-devel libglvnd-opengl libglvnd-glx libglvnd-devel acpid pkgconfig dkms
sudo dnf module install -y nvidia-driver:latest-dkms
sudo reboot
```

After installing the driver, verify its functionality by executing the command `nvidia-smi`.
The output should resemble the following:


```bash
root@nv-emp0:~# nvidia-smi    
+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 545.23.08              Driver Version: 545.23.08    CUDA Version: 12.3     |
|-----------------------------------------+----------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |         Memory-Usage | GPU-Util  Compute M. |
|                                         |                      |               MIG M. |
|=========================================+======================+======================|
|   0  NVIDIA GeForce RTX 4090        Off | 00000000:0A:00.0 Off |                  Off |
|  0%   51C    P0              66W / 450W |      2MiB / 24564MiB |      0%      Default |
|                                         |                      |                  N/A |
+-----------------------------------------+----------------------+----------------------+
                                                                                         
+---------------------------------------------------------------------------------------+
| Processes:                                                                            |
|  GPU   GI   CI        PID   Type   Process name                            GPU Memory |
|        ID   ID                                                             Usage      |
|=======================================================================================|
|  No running processes found                                                           |
+---------------------------------------------------------------------------------------+

```

Configure `cryptenroll` if you have a partition that requires automatic unlocking during system boot.

## Join the Cluster

Now, you are ready to add the node to the cluster. This can be done either as an agent or by installing k3s. Refer to the 'k3s setup' section in the documentation for detailed instructions.

## Install nvidia tools

To the next person reading this, please attempt to install the operator first before proceeding with the installations detailed here. Theoretically, the CUDA, Container-Toolkit, and runtime should be installed by the operator.


```bash
curl -s -L https://nvidia.github.io/libnvidia-container/stable/rpm/nvidia-container-toolkit.repo | \
sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo
sudo dnf -y install cuda-toolkit
sudo dnf -y --disablerepo="rpmfusion-nonfree*" install cuda
sudo dnf install -y nvidia-container-toolkit, nvidia-container-runtime
```


# Install & configure the GPU operator

It's advisable to install the GPU operator as outlined in the NVIDIA documentation available at:
[https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/getting-started.html](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/getting-started.html)

However, be aware of certain pitfalls when installing it on K3s, especially with consumer graphics cards. It's beneficial to review relevant resources for guidance, particularly concerning the values used in the installation.

For instance, the following examples apply to K3s installations located under `/data/k3s`.


If your cluster uses Pod Security Admission (PSA) to restrict the behavior of pods, label the namespace for the Operator to set the enforcement policy to privileged:
```bash
kubectl create ns gpu-operator
kubectl label --overwrite ns gpu-operator pod-security.kubernetes.io/enforce=privileged
```

Node Feature Discovery (NFD) is a dependency for the Operator on each node. By default, NFD master and worker are automatically deployed by the Operator. If NFD is already running in the cluster, then you must disable deploying NFD when you install the Operator.

```bash
kubectl get nodes -o json | jq '.items[].metadata.labels | keys | any(startswith("feature.node.kubernetes.io"))'
```

Add the helm repo:
```bash
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia \
    && helm repo update
```

Create namespace
```
kubectl create ns gpu-operator
```

```bash
helm upgrade --wait \
    -n gpu-operator \
    gpu-operator \
    nvidia/gpu-operator \
    -f - <<EOF
driver:
  enabled: "false"
operator:
  defaultRuntime: containerd
psp:
  enabled: "true"
toolkit:
  env:
  - name: CONTAINERD_CONFIG
    value: /data/k3s/agent/etc/containerd/config.toml
  - name: CONTAINERD_SOCKET
    value: /run/k3s/containerd/containerd.sock
  - name: CONTAINERD_RUNTIME_CLASS
    value: nvidia
  - name: CONTAINERD_SET_AS_DEFAULT
    value: "true"
validator:
  driver:
    env:
    - name: DISABLE_DEV_CHAR_SYMLINK_CREATION
      value: "true"
EOF
```

# Troubleshoot

## Check to node logs

## Check gpu operaor pods

failed init containers may give a clue what is not running `nvidia-operator-validator-xxxx`

## Check containerd config

Containerd config should look like this:

```bash
root@nv-emp0:/dev/char# cat /data/k3s/agent/etc/containerd/config.toml 

# File generated by k3s. DO NOT EDIT. Use config.toml.tmpl instead.
version = 2

[plugins."io.containerd.internal.v1.opt"]
  path = "/data/k3s/agent/containerd"
[plugins."io.containerd.grpc.v1.cri"]
  stream_server_address = "127.0.0.1"
  stream_server_port = "10010"
  enable_selinux = false
  enable_unprivileged_ports = true
  enable_unprivileged_icmp = true
  sandbox_image = "rancher/mirrored-pause:3.6"

[plugins."io.containerd.grpc.v1.cri".containerd]
  snapshotter = "overlayfs"
  disable_snapshot_annotations = true
  



[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
  runtime_type = "io.containerd.runc.v2"

[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
  SystemdCgroup = true









[plugins."io.containerd.grpc.v1.cri".containerd.runtimes."nvidia"]
  runtime_type = "io.containerd.runc.v2"
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes."nvidia".options]
  BinaryName = "/usr/local/nvidia/toolkit/nvidia-container-runtime"
  SystemdCgroup = true
```

## create magic symlink 
```bash
ln -s /sbin/ldconfig /sbin/ldconfig.real
```


## check if nvidia /dev/ exists

you should  see the nvidia devices by running `ls /dev/nvid` and `ls -la /dev/char/ | grep '../nvidia'`.

```bash
root@nv-emp0:~# ls /dev/nvid*
/dev/nvidia0  /dev/nvidiactl  /dev/nvidia-modeset  /dev/nvidia-uvm  /dev/nvidia-uvm-tools

/dev/nvidia-caps:
nvidia-cap1  nvidia-cap2


root@nv-emp0:/dev/char# ls -la /dev/char/ | grep '../nvidia'
lrwxrwxrwx  1 root root   10 Jan 15 20:07 195:0 -> ../nvidia0
lrwxrwxrwx  1 root root   12 Jan 15 20:07 195:255 -> ../nvidiactl
lrwxrwxrwx  1 root root   13 Jan 15 20:07 234:0 -> ../nvidia-uvm
lrwxrwxrwx  1 root root   19 Jan 15 20:07 234:1 -> ../nvidia-uvm-tools
lrwxrwxrwx  1 root root   26 Jan 15 20:07 237:1 -> ../nvidia-caps/nvidia-cap1
lrwxrwxrwx  1 root root   26 Jan 15 20:07 237:2 -> ../nvidia-caps/nvidia-cap2
```

## Check if nvidia runtime exists

```bash
kubectl get runtimeclass nvidia -o yaml

apiVersion: node.k8s.io/v1
handler: nvidia
kind: RuntimeClass
metadata:
  creationTimestamp: "2024-01-12T21:01:04Z"
  labels:
    app.kubernetes.io/component: gpu-operator
  name: nvidia
  ownerReferences:
  - apiVersion: nvidia.com/v1
    blockOwnerDeletion: true
    controller: true
    kind: ClusterPolicy
    name: cluster-policy
    uid: 4ec6b166-c1f6-4b60-bc03-b4cf00699831
  resourceVersion: "41053957"
  uid: 06dcd90a-87ce-4b96-8782-962e00ed1d63
  ``````
