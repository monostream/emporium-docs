# Local-Path

If you don't want any fancy CSI storage driver you can use local-path driver in K3s to create a storage class.
This can be useful if you have a large slow HDD array that is very large or too slow for longhorn.
In the sample below, a **StorageClass** is created on the node `mynode01` and has path `/storage/` as root directory.

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

PVC created with the defined storage class (`mynode01-hdd0`) will create a PV on the node (`mynode01`).
On the disk in the path definde in nodePath (`/storage/`) a new folder is created, named like this `/storage/pvc-10c4df9c-4fef-49be-ad75-17f626c6de38_mynamespace_test-pvc`.

**An important side effect: the POD using such a PV is scheduled on the node defined in the storage class!**
This can be very useful if you have deployments that share one volume with each other!