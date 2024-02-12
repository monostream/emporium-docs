# Storage

This guide outlines how to configure RAID 10 with LVM on Fedora and integrate the storage into Longhorn for Kubernetes use. It walks through installing essential packages, creating a RAID array, and managing logical volumes for improved performance and redundancy. It also details making the setup accessible in Longhorn, including setting up a dedicated StorageClass, to facilitate reliable and efficient storage solutions Kubernetes clusters.


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
  defaultReplicaCount: 2
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
  defaultClassReplicaCount: 2
```

Before installing Longhorn make sure that the directory specified under defaultDataPath actually exists on the host.

When configuring the replica count, it's important to tailor the value to the number of nodes in your cluster. 
In this example, the count is set to 2, matching a cluster of the same size. Adjust this setting to correspond with the capacity of your particular cluster environment.

While enabling ingress is an option, it is advised to do so with caution. Ensure its security by placing an authentication proxy before it unless you have a specific reason and the necessary security measures in place.

The configuration also includes an enabled backup feature that automates the process of uploading backups to an S3 bucket. This ensures data durability and aids in disaster recovery planning.

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

::: tip
All steps should be executed as user root.
:::


Step 1: Install Required Packages
First, ensure that mdadm and lvm2 are installed on your system. You can install them using:

```bash
sudo dnf install mdadm lvm2
```

Step 2: Find newly installed disks
```bash
fdisk -l
```
In this guide, we'll be using /dev/sda through /dev/sdd to initialize the software RAID array. Your system's disk identifiers may vary based on the number of disks you plan to include in your setup.

Step 3: Create the RAID Array
You'll use mdadm to create a RAID 10 array, which is suitable for your four disks and provides a good balance of redundancy and performance. Here's how to create it:

```bash
mdadm --create --verbose /dev/md0 --level=10 --raid-devices=4 /dev/sda /dev/sdb /dev/sdc /dev/sdd
```
Make sure to replace /dev/sd[b-e] with the actual device names of your disks.

Step 4: Verify the RAID Array
It's good practice to check the array's creation status:

```bash
mdadm --detail /dev/md0
```

Step 5: Create Physical Volume (PV) on the RAID Array
Now, initialize the RAID array as a physical volume (PV) for use with LVM:

```bash
pvcreate /dev/md0
```

Step 6: Create Volume Group (VG)
Create a volume group (VG) that includes the PV you just created. This is where you'll allocate logical volumes (LVs):

```bash
vgcreate vg0 /dev/md0
```

Step 7: Create Logical Volumes (LV)
Now, decide how you want to divide the space and create one or more logical volumes within the volume group. For example, to use all available space for a single logical volume:

```bash
lvcreate -l 100%FREE -n lv_data vg0
```

Step 8: Format and Mount the Logical Volume
Choose a filesystem (e.g., ext4) and format your logical volume:

```bash
mkfs.xfs /dev/vg0/lv_data
```

Create a mount point and mount the logical volume:

```bash
mkdir /storage
mount /dev/vg0/lv_data /storage
```

Step 9: Ensure RAID and LVM Configuration Persist
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

Additional Fedora Considerations:
- Fedora uses firewalld for firewall management and SELinux for security enforcement. Ensure your system's security settings are configured to allow services you plan to use with these storage configurations.
- Always backup important data before performing disk operations, especially when creating RAID arrays and logical volumes.
Fedora documentation and man pages (man mdadm, man lvm) provide extensive information and options for customization.
- This guide gives a streamlined approach to setting up RAID 10 and LVM on Fedora. Depending on your specific requirements, you might need to adjust partition sizes, filesystem types, or other settings.

##  Making Disk Available in Longhorn

Add disks to Node in Longhorn:
- Edit Node and Disk of the server containing the newly created storage
- Add new disk on mountpath /storage
- Enable Scheduling
- Add disk label raid-10-lvm

Create a new StorageClass which specifically selects the mountpoint on the Node:
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