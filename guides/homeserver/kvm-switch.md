
# KVM Management access

If you're managing multiple physical computers and prefer the convenience of controlling them all from a single point, a KVM (Keyboard, Video, Mouse) solution could be an ideal fit for you. A KVM switch allows you to connect multiple PCs, enabling you to control them using just one set of peripherals: a single monitor, keyboard, and mouse. This setup can be particularly beneficial if you want to declutter your workspace or streamline your hardware management.

A notable feature of KVM technology is its versatility. While traditionally it involves physical hardware, modern solutions also offer virtual alternatives. For instance, instead of a physical monitor, keyboard, and mouse, you can use a computer equipped with an HDMI grabber and a USB emulator. These devices serve as intermediaries, capturing video output and emulating keyboard/mouse inputs, effectively replicating the traditional KVM experience in a digital format.

One exemplary product in this domain is PiKVM. It stands out for its ability to capture HDMI input and emulate keyboard and mouse controls, providing remote access to your connected systems via VNC through a web browser. This functionality is particularly useful for remote management and troubleshooting, as it allows you to control and monitor your machines from anywhere with an internet connection.

In our setup, we integrate a Manhattan KVM switch with the PiKVM, connecting it to the physical machines. This combination enhances flexibility, enabling you to switch control between different systems effortlessly. To toggle between the connected devices, you can use convenient keyboard shortcuts, further simplifying the process and enhancing your productivity.

By adopting a KVM solution, particularly one enhanced with PiKVM, you can enjoy a seamless and efficient way to manage multiple computers, whether you're physically present or accessing them remotely.

Links:

[PiKVM](https://pikvm.org/)

[Manhattan Switches](https://manhattanproducts.eu/collections/kvm-switches)


When buying Manhattan KVM and PiKVM, note: Manhattan includes a exampel USB cable but not HDMI; PiKVM needs a separate USB-C to USB-A cable and a power supply, etc.



# Setup
We don't describe the setup here. To setup the KVM switch is a no brainer and PiKVM has an excellent documentation.
But we encountered two Problems:

## Solve not working keyboard


#### Preliminary Step: Disable TPM in BIOS

1. **Access BIOS Settings:** Restart your Intel NUC and enter the BIOS setup. This is typically done by pressing the F2 key during the boot process.
2. **Disable TPM:** Locate the TPM settings within the BIOS menu and disable it. Disabling TPM helps avoid conflicts that might prevent the KVM switch from being recognized correctly.

#### Configure the System to Ignore Conflicting Modules

Some KVM switches are detected as a Logitech device, which leads to the automatic loading of the `hid_logitech_dj` module. This module can cause operational issues our case

#### Blacklist the Problematic Module

- **Open Terminal:** Access your terminal on the Intel NUC.
- **Create Blacklist File:** Run the following command to add a blacklist entry for the `hid_logitech_dj` module:
   ```
   echo "blacklist hid_logitech_dj" > /etc/modprobe.d/kvm.conf
   ```


#### Regenerate initramfs

Regenerating the initramfs is essential after modifying module settings:

1. **Regenerate initramfs:** Execute the command below to regenerate initramfs, ensuring the changes take effect:
   ```
   dracut --regenerate-all --force
   ```

#### Re-enable TPM in BIOS

After configuring the system:

1. **Reboot and Enter BIOS:** Restart your NUC and access the BIOS again.
2. **Enable TPM:** Re-enable TPM in the BIOS settings.

#### Post-Configuration Steps

If you are using TPM to unlock a LUKS encrypted device at boot, additional steps are required:

1. **Reconfigure Systemd-cryptenroll:** You may need to update your PCR values and specify the encrypted device. Use the following command to update the TPM settings for systemd-cryptenroll:
   ```
   systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=4+7 /dev/nvme0n1p3
   ```

2. **Be Aware:** Ensure you are aware of the changes to PCR values and the specific device being encrypted. Incorrect values can prevent your system from unlocking the encrypted device at boot.


# Setup access via TOR

To use PiKVM as last resort access your system TOR might be an option to avoid reliance DNS, other Infrastructure or services like tailscale.
As long as PiKVM has internet TOR should be a reliable option to expose the WebInterface but it might also be a very stupid idea.

```bash
sudo pacman -Sy tor
```

Configure TOR and open
```bash
sudo vi /etc/tor/torrc
```

add those lines

```
 HiddenServiceDir /var/lib/tor/pikvm/
 HiddenServicePort 80 127.0.0.1:80
 HiddenServicePort 443 127.0.0.1:443
```

Restart TOR
```
sudo systemctl restart tor
```

Get your onion address:

```
sudo cat /var/lib/tor/pikvm_hidden_service/hostname
````

With this address you can connect with a TOR browser (eg. Brave) to your KVM.