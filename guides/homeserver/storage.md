# Storage

::: tip
All steps should be executed as user root.
:::


Step 1: Install Required Packages
First, ensure that mdadm and lvm2 are installed on your system. You can install them using:

```bash
sudo dnf install mdadm lvm2
```

Step 2: Create the RAID Array
You'll use mdadm to create a RAID 10 array, which is suitable for your four disks and provides a good balance of redundancy and performance. Here's how to create it:

```bash
mdadm --create --verbose /dev/md0 --level=10 --raid-devices=4 /dev/sda /dev/sdb /dev/sdc /dev/sdd
```
Make sure to replace /dev/sd[b-e] with the actual device names of your disks.

Step 3: Verify the RAID Array
It's good practice to check the array's creation status:

```bash
mdadm --detail /dev/md0
```

Step 4: Create Physical Volume (PV) on the RAID Array
Now, initialize the RAID array as a physical volume (PV) for use with LVM:

```bash
pvcreate /dev/md0
```

Step 5: Create Volume Group (VG)
Create a volume group (VG) that includes the PV you just created. This is where you'll allocate logical volumes (LVs):

```bash
vgcreate vg0 /dev/md0
```

Step 6: Create Logical Volumes (LV)
Now, decide how you want to divide the space and create one or more logical volumes within the volume group. For example, to use all available space for a single logical volume:

```bash
lvcreate -l 100%FREE -n lv_data vg0
```

Step 7: Format and Mount the Logical Volume
Choose a filesystem (e.g., ext4) and format your logical volume:

```bash
mkfs.xfs /dev/vg0/lv_data
```

Create a mount point and mount the logical volume:

```bash
mkdir /storage
mount /dev/vg0/lv_data /storage
```

Step 8: Ensure RAID and LVM Configuration Persist
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