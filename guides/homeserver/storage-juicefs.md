# Juicefs

Here are some installation notes about how to install JucieFs, with the storage backed by a minio that is installed using local-path.


Create PV and PVC via local-path storage class, directly on the machine:

```bash
cat <<EOF | kubectl apply -n juciefs -f -
apiVersion: v1
kind: PersistentVolume
metadata:
  name: minio-pvc
spec:
  capacity:
    storage: 10000Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-path
  local:
    path: /storage/minio
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - nv-emp0 
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: minio-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10000Gi
  volumeName: minio-pv
  storageClassName: "local-path"
EOF
```




```yaml
deploymentUpdate:
type: Recreate
replicas: 1
mode: standalone

persistence:
enabled: true
existingClaim: "minio-pvc"

consoleIngress:
enabled: true
annotations:
    kubernetes.io/tls-acme: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "0"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "15"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/service-upstream: "true"
path: /
hosts:
    - juciefs-minio.emporium.host
tls:
    - secretName: jucieminio-tls
    hosts:
        - juciefs-minio.your.host

ingress:
enabled: true
annotations:
    kubernetes.io/tls-acme: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "0"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "15"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/service-upstream: "true"
path: /
hosts:
    - s3-juciefs-minio.your.host
tls:
    - secretName: jucieminio-s3-tls
    hosts:
        - s3-juciefs-minio.your.host
```


```bash
helm repo add minio https://charts.min.io/
helm upgrade --install -n juciefs minio minio/minio -f minio.yaml
```