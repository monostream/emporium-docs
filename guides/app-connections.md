# App connections

Some apps need another app. LNbits needs a Lightning node (lnd). lnd needs a Bitcoin node (Bitcoin Core).
electrs also needs Bitcoin Core, and mempool can use Bitcoin Core, electrs and lnd. Emporium connects installed apps to each other. The
app that offers a service is the **producer**, the app that uses it is the **consumer**.

Emporium has no list of known services. A service is described by a *capability id* such as
`bitcoind-rpc/v1`, a string that the charts of the producer and the consumer agree on. Emporium
checks that the producer fits what the consumer needs and sets up network access and credentials.

## Connect apps

1. Install the producer first, for example Bitcoin Core. Let it start.
2. Install the consumer, for example lnd. The install form shows one picker for each connection the chart
   declares. It lists the installed producers that offer the right capability.
3. Pick a producer. If a producer does not fit, it is greyed out and the tooltip says why (for example it
   runs another network, or it does not have the index the consumer needs). If the producer offers several
   exports of that capability, you also pick the export. Where the producer offers permission levels, the
   consumer's chart decides which one it asks for.
4. The picker warns when connecting restarts the producer. Bitcoin Core reads its RPC users only at start, so it
   restarts when a consumer is connected or removed.

Emporium then lets the consumer's namespace reach the producer through the producer's network policy (your
cluster needs a CNI that enforces network policies for this to restrict anything) and hands over credentials in
the consumer's own Secret. Credentials are never written to values or logs.

An app's **Connections** tab lists both directions: what the app provides to other apps, and what it uses.
Each connection has a state:

| State | Meaning |
|---|---|
| `ACTIVE` | The producer serves the connection |
| `PENDING` | The connection is recorded but not yet applied to the producer |
| `FAILED` | The producer could not apply its current connections |
| `BROKEN` | The producer is missing or not owned by Emporium, the grant is missing, or the exported credentials cannot be verified |

Rules:

- A connection cannot be switched to another producer. To use another one, uninstall the consumer and install it
  again. An optional connection can be turned off in one update and turned on, with another producer, in a later one.
- A producer update that removes or changes something a consumer depends on is refused.
- Disconnecting closes the network path. Credentials that the consumer already holds keep working until the
  producer rotates them. For lnd, a copied macaroon is valid until lnd rotates its root key.
- There is no "external node" mode in Emporium. A chart may offer its own inputs for a node outside the cluster.

## Uninstall is blocked while other apps depend on it

You cannot uninstall a producer that still has consumers. The uninstall fails with `has-consumers`, and the
uninstall dialog names the apps that use it. Uninstall them, or turn off their optional connection, first.

Uninstalling a consumer is always possible. It removes its access from the producer and, if the producer restarts
on changes, restarts it.

## Back up the lnd seed

On its first start lnd creates a wallet seed (24 words) and keeps it in the app Secret
`<app>-emporium-secrets`, key `wallet-seed`. It is never logged. lnd also keeps the static channel backup
in the Secret `<app>-exports`, key `channel.backup`. **Uninstalling lnd deletes the seed.**

Right after the install, an administrator with access to the namespace saves both off the cluster:

```sh
kubectl -n <namespace> get secret <app>-emporium-secrets -o jsonpath='{.data.wallet-seed}' | base64 -d
kubectl -n <namespace> get secret <app>-exports -o jsonpath='{.data.channel\.backup}' | base64 -d > channel.backup
```

Save `channel.backup` again after every channel open or close. The seed together with `channel.backup`
recovers your funds; the wallet password alone does not. The restore steps are in the lnd chart's README.

## For chart authors

A producer declares `exports`. A consumer declares an integration of `type: app` with the capability it needs.

```yaml
# producer (bitcoin-core)
exports:
  rpc:
    capability: bitcoind-rpc/v1
    service: "{{ .Emporium.Name }}"
    ports: { rpc: 8332 }
    facts:
      Network: { type: string, value: "{{ .Emporium.Inputs.Network }}", immutable: true }
    credentials: { kind: rpcauth }
    grantsPath: bitcoind.grants
```

```yaml
# consumer (lnd)
integrations:
  bitcoind:
    type: app
    capability: bitcoind-rpc/v1
    requires: { TxIndex: true }
```

- `requires` compares the producer's facts with a value, or with `sameAs: <name>` with the same fact of an earlier
  `app` integration of the same chart. mempool uses it to require that its electrs and lnd connections run on the same network as its Bitcoin Core connection.
- `credentials.kind` is `none`, `rpcauth` (Emporium creates a user and password per consumer) or `exported`
  (the chart publishes a Secret and Emporium copies the listed keys to each consumer).
- The producer chart renders a network policy from the list that Emporium writes to `grantsPath`. The chart
  never sets that path itself.
- A consumer chart ships `ci/connections.yaml`, a fixture of the outputs a producer would provide, so that
  `emp chart lint` can render it.

Every field is listed in the [`emporium.yaml` reference](../reference/emporium-yaml#exports). The lint rules and
the full author guide are in the chart author manual, section "App connections".
