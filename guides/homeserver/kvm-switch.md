
# KVM Switch Troubleshooting Guide for Intel NUCs with TPM

## Overview

This guide provides troubleshooting steps for connecting a KVM switch to Intel NUCs that have TPM (Trusted Platform Module) enabled. Following these instructions should help you resolve issues related to the KVM switch detection and operation.

## Preliminary Step: Disable TPM in BIOS

1. **Access BIOS Settings:** Restart your Intel NUC and enter the BIOS setup. This is typically done by pressing the F2 key during the boot process.
2. **Disable TPM:** Locate the TPM settings within the BIOS menu and disable it. Disabling TPM helps avoid conflicts that might prevent the KVM switch from being recognized correctly.

## Configure the System to Ignore Conflicting Modules

Some KVM switches are detected as a Logitech device, which leads to the automatic loading of the `hid_logitech_dj` module. This module can cause operational issues.

### Blacklist the Problematic Module

1. **Open Terminal:** Access your terminal on the Intel NUC.
2. **Create Blacklist File:** Run the following command to add a blacklist entry for the `hid_logitech_dj` module:
   ```
   echo "blacklist hid_logitech_dj" > /etc/modprobe.d/kvm.conf
   ```

### Regenerate initramfs

Regenerating the initramfs is essential after modifying module settings:

1. **Regenerate initramfs:** Execute the command below to regenerate initramfs, ensuring the changes take effect:
   ```
   dracut --regenerate-all --force
   ```

## Re-enable TPM in BIOS

After configuring the system:

1. **Reboot and Enter BIOS:** Restart your NUC and access the BIOS again.
2. **Enable TPM:** Re-enable TPM in the BIOS settings.

## Post-Configuration Steps

If you are using TPM to unlock a LUKS encrypted device at boot, additional steps are required:

1. **Reconfigure Systemd-cryptenroll:** You may need to update your PCR values and specify the encrypted device. Use the following command to update the TPM settings for systemd-cryptenroll:
   ```
   systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=4+7 /dev/nvme0n1p3
   ```

2. **Be Aware:** Ensure you are aware of the changes to PCR values and the specific device being encrypted. Incorrect values can prevent your system from unlocking the encrypted device at boot.

## Conclusion

Following these steps should resolve issues with using a KVM switch on Intel NUCs with TPM enabled, facilitating a smooth and functional setup. For further assistance, consult your KVM switch and NUC documentation or contact technical support.
