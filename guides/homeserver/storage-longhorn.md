# Longhorn

## Install Longhorn

Add Helm repo:
```bash
helm repo add longhorn https://charts.longhorn.io
```

Example values:
```bash
defaultSettings:
  backupTarget: s3://emporium-host-backup@auto/
  backupTargetCredentialSecret: r2-credentials
  createDefaultDiskLabeledNodes: null
  defaultDataLocality: null
  defaultDataPath: /data/longhorn
  defaultReplicaCount: 3
ingress:
  annotations:
    glass.monostream.com/enabled: "true"
    kubernetes.io/tls-acme: "true"
  enabled: true
  host: longhorn.emporium.host
  tls: true
  tlsSecret: longhorn-tls
persistence:
  defaultClass: true
  defaultClassReplicaCount: 3
```

Before proceeding with the Longhorn installation, ensure the path specified under defaultDataPath exists on the host system.

When setting the replica count, adjust it according to the number of nodes within your cluster. For instance, a replica count of 3 is ideal for a cluster comprising three nodes. 
Modify this parameter to suit the specific capabilities of your cluster.

Exercise caution if enabling ingress. It's recommended to secure it by implementing an authentication proxy upfront unless there are compelling reasons and adequate security measures already in place. In this guide, we employ the Glass Proxy from Emporium to establish a secured Ingress, activating it with the following annotation: glass.monostream.com/enabled: "true".

The configuration further incorporates a backup feature, streamlining the process of uploading backups to an S3 bucket. This function enhances data resilience and supports disaster recovery efforts.

```bash
{
  "AWS_ACCESS_KEY_ID": "AKIAIOSFODNN7EXAMPLE",
  "AWS_ENDPOINTS": "https://s3.example.com",
  "AWS_SECRET_ACCESS_KEY": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}
```

Install:
```bash
kubectl create namespace longhorn-system
helm install longhorn longhorn/longhorn --namespace longhorn-system -f values.yaml
```

## Initializing Software RAID 10

- Although this guide is tailored for Fedora, it can be utilized with other Linux distributions. You may need to use the specific package manager of your distro to install the required dependencies, rather than using dnf.
- Fedora uses firewalld for firewall management and SELinux for security enforcement. Ensure your system's security settings are configured to allow services you plan to use with these storage configurations.
- Always backup important data before performing disk operations, especially when creating RAID arrays and logical volumes.
Fedora documentation and man pages (man mdadm, man lvm) provide extensive information and options for customization.
- This guide gives a streamlined approach to setting up RAID 10 and LVM on Fedora. Depending on your specific requirements, you might need to adjust partition sizes, filesystem types, or other settings.


::: tip
All steps should be executed as user root.
:::


Install Required Packages:
```bash
dnf install mdadm lvm2
```

Find newly installed disks:
```bash
fdisk -l
```
In this guide, we'll be using /dev/sda through /dev/sdd to initialize the software RAID array. Your system's disk identifiers may vary based on the number of disks you plan to include in your setup.


Use mdadm to create a RAID 10 array, which is suitable for your four disks and provides a good balance of redundancy and performance. Here's how to create it:
```bash
mdadm --create --verbose /dev/md0 --level=10 --raid-devices=4 /dev/sda /dev/sdb /dev/sdc /dev/sdd
```
Make sure to replace /dev/sd[a-c] with the actual device names of your disks.

Verify the RAID Array:
```bash
mdadm --detail /dev/md0
```

Now, initialize the RAID array as a physical volume (PV) for use with LVM:
```bash
pvcreate /dev/md0
```

Create a volume group (VG) that includes the PV you just created. This is where you'll allocate logical volumes (LVs):
```bash
vgcreate vg0 /dev/md0
```

Now, decide how you want to divide the space and create one or more logical volumes within the volume group. For example, to use all available space for a single logical volume:
```bash
lvcreate -l 100%FREE -n lv_data vg0
```

Choose a filesystem (e.g., xfs) and format your logical volume:
```bash
mkfs.xfs /dev/vg0/lv_data
```

Create a mount point and mount the logical volume:
```bash
mkdir /storage
mount /dev/vg0/lv_data /storage
```

Make sure the RAID configuration persists across reboots by adding it to the mdadm configuration file:
```bash
mdadm --detail --scan | tee -a /etc/mdadm.conf
```

Then, update your initial ramdisk (initrd) to ensure the RAID array is recognized at boot:
```bash
dracut --force
```

Finally, add your mounted logical volume to /etc/fstab to ensure it gets mounted automatically at boot.
```bash
echo '/dev/vg0/lv_data /storage xfs defaults 0 0' | tee -a /etc/fstab
```

##  Making Disk Available in Longhorn

Add disks to Node in Longhorn:
```bash
kubectl -n longhorn-system edit node.longhorn.io [NAME]
```

Add this to your spec:
```bash
spec:
  disks:
    raid-10-lvm:
      allowScheduling: true
      diskType: filesystem
      evictionRequested: false
      path: /storage
      storageReserved: 0
      tags:
      - raid-10-lvm
```

Create a new StorageClass which specifically selects the device on the Node:
```bash
kubectl apply -f - << EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  annotations:
  name: longhorn-mass-storage
parameters:
  dataLocality: disabled
  fromBackup: ""
  fsType: xfs
  numberOfReplicas: "1"
  staleReplicaTimeout: "30"
  diskSelector: "raid-10-lvm"
provisioner: driver.longhorn.io
reclaimPolicy: Delete
volumeBindingMode: Immediate
allowVolumeExpansion: true
EOF
```