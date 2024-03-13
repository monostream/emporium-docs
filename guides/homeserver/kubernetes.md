# Kubernetes basics

This is a brief summary about kubernetes - We are sure there are a lot better tutorials out there, that are more helpful to understand kubernetes.

## Concepts

Kubernetes is a powerful platform for managing containerized applications, offering a range of concepts that work together to provide a robust, scalable, and efficient environment for deploying and managing your applications. Here's a brief overview of the key concepts:


### Nodes

In Kubernetes, a node is a machine, either physical or virtual, on which Kubernetes runs your applications. It is a worker machine in Kubernetes and can be a VM or a physical computer, serving as the home for your application containers. Each node contains the services necessary to run pods, which are managed by the master components. Nodes handle the actual workload of your applications and are essential components in the Kubernetes ecosystem.

https://kubernetes.io/docs/concepts/architecture/nodes/

Kubectl command to get nodes:

```bash
➜  ~ kubectl get nodes
NAME      STATUS   ROLES                  AGE   VERSION
emp0      Ready    control-plane,master   8d    v1.29.1+k3s2
emp1      Ready    <none>                 8d    v1.29.1+k3s2
```

### Namespaces

Namespaces in Kubernetes are a way to divide your cluster's resources between multiple users and projects. Think of namespaces as folders that organize and isolate your Kubernetes objects, such as pods, services, and deployments. By using namespaces, you can create separate environments within the same cluster, making it easier to manage access, resources, and quotas for different teams or projects.

https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/

Kubectl command to get namespaces:

```bash
➜  ~ kubectl get ns
NAME                STATUS   AGE
default             Active   231d
kube-system         Active   231d
kube-public         Active   231d
kube-node-lease     Active   231d
network-system      Active   231d
longhorn-system     Active   231d
system-upgrade      Active   201d
emporium            Active   70d
build               Active   16d
monitoring-system   Active   14d
```

### PODs

Pods are the smallest, most basic deployable objects in Kubernetes. A pod represents a single instance of a running process in your cluster. Pods contain one or more containers, such as Docker containers. When a pod runs multiple containers, the containers are managed as a single entity and share the pod's resources, such as networking and storage. Pods are ephemeral by nature; they are created and destroyed to match the state of your application as defined in deployments or other workload resources.

https://kubernetes.io/docs/concepts/workloads/pods/pod/


```bash
➜  ~ kubectl get pods -n kube-system
NAME                                     READY   STATUS    RESTARTS       AGE
cilium-6qfmm                             1/1     Running   2 (6d1h ago)   7d6h
local-path-provisioner-957fdf8bc-kmc75   1/1     Running   2 (6d1h ago)   7d6h
coredns-7c8fc45dbb-tn2kf                 1/1     Running   1 (6d1h ago)   6d3h
metrics-server-648b5df564-q9hb9          1/1     Running   2 (6d1h ago)   7d6h
cilium-operator-86bd46d78b-df2fr         1/1     Running   14 (6d ago)    7d6h
cilium-lgjr6                             1/1     Running   13 (6d ago)    7d6h
cilium-9m9zf                             1/1     Running   3 (6d ago)     7d6h
```

### Services

Services in Kubernetes are an abstraction that defines a logical set of pods and a policy by which to access them. This abstraction enables pod-to-pod communication within the cluster as well as external access to the cluster's services. Essentially, a service routes network traffic to pods, providing a stable endpoint for your application, regardless of the changes in the underlying pods. Services help you connect applications together and expose your applications to the external world, ensuring smooth communication and scalability.


https://kubernetes.io/docs/concepts/services-networking/service/


```bash
NAME                               TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)                        AGE
monitoring-prometheus-kubelet      ClusterIP   None           <none>        10250/TCP,10255/TCP,4194/TCP   195d
kube-dns                           ClusterIP   10.43.0.10     <none>        53/UDP,53/TCP,9153/TCP         231d
metrics-server                     ClusterIP   10.43.247.87   <none>        443/TCP                        231d
observability-prometheus-kubelet   ClusterIP   None           <none>        10250/TCP,10255/TCP,4194/TCP   60d
monitoring-prometheus-kube-etcd    ClusterIP   None           <none>        2381/TCP                       27h
monitoring-prometheus-coredns      ClusterIP   None           <none>        9153/TCP                       27h
```

### Ingresses

Ingresses in Kubernetes provide HTTP and HTTPS routing to services. An Ingress allows you to define rules for external access to your services in the cluster, such as URL paths and hostnames. It acts as a gateway that directs incoming traffic to the appropriate services based on the defined rules. This is particularly useful for managing access to multiple services within your cluster from a single entry point, enabling you to expose your applications to the external world in a controlled and efficient manner.

https://kubernetes.io/docs/concepts/services-networking/ingress/

```bash
➜  ~ kubectl get ingress -n gitlab    
NAME                        CLASS   HOSTS                           ADDRESS        PORTS     AGE
emporium-panel              nginx   panel.emporium.build            10.25.10.102   80, 443   168d
```