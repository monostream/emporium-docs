# Initial Setup

::: tip
The IP address `172.16.16.1` used in this tutorial is an example. Replace it with the actual IP address of your server wherever it appears in the script.
:::

Connect to your VM via SSH:
```bash
ssh monostream@172.16.16.1
```

Switch to root user:
```bash
sudo su -
```

Install updates:
```bash
dnf update -y
dnf autoremove -y
reboot
```

Find LUKS partition:
```bash
lsblk
```

```bash
NAME                                          MAJ:MIN RM  SIZE RO TYPE  MOUNTPOINTS
zram0                                         252:0    0    8G  0 disk  [SWAP]
nvme0n1                                       259:0    0  1.8T  0 disk
├─nvme0n1p1                                   259:1    0  600M  0 part  /boot/efi
├─nvme0n1p2                                   259:2    0    1G  0 part  /boot
└─nvme0n1p3                                   259:3    0  1.8T  0 part
  └─luks-b4dddfe3-ae94-4215-8f6e-bdf31ba906f1 253:0    0  1.8T  0 crypt
    ├─fedora-root                             253:1    0   32G  0 lvm   /
    └─fedora-data                             253:2    0  1.8T  0 lvm   /data
```

```bash
systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=4+7 /dev/nvme0n1p3
```

Enroll your encrypted volumes:
Add `tpm2-device=auto,discard` to the end of each LUKS device line in `/etc/crypttab`
```bash
vi /etc/crypttab
```
```bash
luks-b4dddfe3-ae94-4215-8f6e-bdf31ba906f1 UUID=b4dddfe3-ae94-4215-8f6e-bdf31ba906f1 - tpm2-device=auto,discard
```


Edit `/etc/default/grub` and add `rd.luks.options=tpm2-device=auto` to GRUB_CMDLINE_LINUX.
```bash
vi /etc/default/grub
```

```bash
[...]
GRUB_CMDLINE_LINUX="rd.lvm.lv=fedora/root rd.luks.uuid=luks-b4dddfe3-ae94-4215-8f6e-bdf31ba906f1 rd.luks.options=tpm2-device=auto rhgb quiet"
[...]

```

Run dracut -f to rebuild the initrd & reboot:
```bash
dracut -f
systemctl reboot
```


Generate LUKS recovery key:
```bash
systemd-cryptenroll --recovery-key /dev/nvme0n1p3
```


Disable FirewallD and SELinux:
```bash
systemctl disable firewalld.service
systemctl stop firewalld.service

sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
```

Increase inotify resource limits:
```bash
tee /etc/sysctl.d/k3s.conf << EOF
fs.inotify.max_user_instances = 1024
fs.inotify.max_user_watches = 1048576
EOF
```

Install K3S with Cilium as CNI:
```bash
sudo su -
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/master/stable.txt)
CLI_ARCH=amd64
if [ "$(uname -m)" = "aarch64" ]; then CLI_ARCH=arm64; fi
curl -L --fail --remote-name-all https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
sha256sum --check cilium-linux-${CLI_ARCH}.tar.gz.sha256sum
tar xzvfC cilium-linux-${CLI_ARCH}.tar.gz /usr/local/bin
rm -rf cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}

mkdir /data/k3s

export INSTALL_K3S_EXEC="server --flannel-backend=none --disable-kube-proxy --disable-network-policy --disable-cloud-controller --disable=traefik --disable=servicelb --bind-address=172.16.16.1 --advertise-address=172.16.16.1 --data-dir=/data/k3s"
curl -sfL https://get.k3s.io | sh -

# replace k8sServiceHost with the IP address of your control plane node
cilium install --helm-set=k8sServiceHost=172.16.16.1,k8sServicePort=6443
cilium hubble enable --ui
```

Install K3S Agent Node and join it:
```bash
# get join token from control plane node
cat /data/k3s/server/node-token

# install k3s agent
export INSTALL_K3S_EXEC="agent --data-dir=/data/k3s"
curl -sfL https://get.k3s.io | K3S_URL=https://172.16.16.1:6443 K3S_TOKEN={TOKEN} sh -
```
