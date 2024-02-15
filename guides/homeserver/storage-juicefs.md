# JuiceFS

This guide outlines how to setup an external S3 storage to be consumed in Kubernetes via JuiceFS. 

In this simplified example a MinIO is installed inside the Cluster using local-path and a very basic Redis installation for the Metadata engine.


## Install MinIO

Create PV and PVC via local-path storage class, directly on the machine:

```bash
cat <<EOF | kubectl apply -n juicefs -f -
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

Helm values for MinIO:

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
    - juicefs-minio.your.host
tls:
    - secretName: juiceminio-tls
    hosts:
        - juicefs-minio.your.host

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
    - s3-juicefs-minio.your.host
tls:
    - secretName: juiceminio-s3-tls
    hosts:
        - s3-juicefs-minio.your.host
```


```bash
helm repo add minio https://charts.min.io/
helm upgrade --install -n juicefs minio minio/minio -f minio.yaml
```

## Install Redis

Standalone Redis installation helm values:

```yaml
architecture: standalone
auth:
  enabled: false
  sentinel: false
master:
  persistence:
    enabled: true
replica:
  persistence:
    enabled: false
  replicaCount: 0

```

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm upgrade --install -n juicefs redis bitnami/redis -f redis.yaml
```

## Install JuiceFS

Basic JuiceFS installation helm values:

```yaml
node:
  storageClassShareMount: true
storageClasses:
- name: "juicefs"
  enabled: true
  backend:
    name: "jfs"
    metaurl: "redis://redis-master.juicefs.svc.cluster.local:6379/0"
    storage: "minio"
    bucket: "http://minio.juicefs.svc.cluster.local:9000/juicefs"
    accessKey: "MINIO-ACCESS-KEY"
    secretKey: "MINIO-SECRET-KEY"
```

```bash
helm repo add juicefs https://juicedata.github.io/charts/
helm upgrade --install -n juicefs juicefs-csi-driver juicefs/juicefs-csi-driver -f juicefs.yaml
```


## Using JuiceFS storage class

A simple pod manifest using the newly created JuiceFS as storage

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: juicefs-fio
spec:
  containers:
  - name: benchmark
    image: dmonakhov/alpine-fio:latest
    imagePullPolicy: Always
    command:
      - /bin/sh
      - '-c'
    args:
      - while true; do sleep 1000; done
    volumeMounts:
      - mountPath: /data
        name: juicefs-pv
  volumes:
  - name: juicefs-pv
    persistentVolumeClaim:
      claimName: juicefs-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: juicefs-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: juicefs
```

There you should be able to exec into the pod and access the JuiceFS mount under `/data`, you can also run some benchmark tests with `fio`.
