# Local-Path

Utilizing the local-path storage driver in K3s presents a straightforward and efficient alternative for users seeking a non-CSI storage solution. This approach is particularly advantageous for leveraging large, slower HDD arrays that may not be compatible with or perform optimally for solutions like Longhorn. The local-path storage driver facilitates the creation of a StorageClass tailored to specific storage needs without the complexity of more advanced CSI drivers.

The example below demonstrates the configuration for creating a StorageClass on Node mynode01, utilizing /storage/ as the root directory. 

```yaml
kubectl apply -f - << EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: mynode01-hdd0
  annotations:
    defaultVolumeType: local
provisioner: rancher.io/local-path
parameters:
  nodePath: /storage
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowedTopologies:
  - matchLabelExpressions:
      - key: kubernetes.io/hostname
        values:
          - mynode01
EOF
```

To integrate this storage class into your K3s environment effectively, it's necessary to adjust the local-path-provisioner ConfigMap. This modification ensures the provisioner recognizes the specific storage path designated for the node. You can achieve this by editing the ConfigMap directly, adding an entry under nodePathMap within the config.json to include the new node-specific path.

```json
{
    "nodePathMap": [
        {
            "node": "DEFAULT_PATH_FOR_NON_LISTED_NODES",
            "paths": [
                "/data/k3s/storage"
            ]
        },
        {
            "node": "mynode01",
            "paths": [
                "/storage"
            ]
        }
    ]
}
```

K3s reapplies its state from the manifests directory. Currently only DEFAULT_PATH_FOR_NON_LISTED_NODES is [configurable](https://github.com/k3s-io/k3s/blob/master/manifests/local-storage.yaml#L111). Any additional nodePathMap value will be discarded on k3s service restart.

As a workaround, you will have to create a [skip file](https://docs.k3s.io/installation/packaged-components#disabling-manifests) for local-path-provisioner in your manifests directory.

PVC created with the defined storage class (`mynode01-hdd0`) will create a PV on the node (`mynode01`).
On the disk in the path defined in nodePath (`/storage/`) a new folder is created, named like this `/storage/pvc-10c4df9c-4fef-49be-ad75-17f626c6de38_mynamespace_test-pvc`.

**An important side effect: the POD using such a PV is scheduled on the node defined in the storage class!**
This can be very useful if you have deployments that share one volume with each other!