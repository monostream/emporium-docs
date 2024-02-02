# Uninstallation

Follow these steps to properly uninstall Emporium and all installed apps from your cluster.

## Uninstalls Apps

As the first step, make sure to uninstall all apps via Emporium UI before proceeding. Installed apps won't be automatically removed upon Emporium's uninstallation.

## Helm Uninstall

Run the following command to uninstall Emporium.

```sh
helm uninstall emporium -n emporium
```

::: info
Make sure you replace the helm release name and namespace with values matching your installation.
:::

To completely get rid of all resources created by the Emporium helm chart, it's recommended to delete the corresponding namespace. You can do that by running the following command.

```sh
kubectl delete ns emporium
```
