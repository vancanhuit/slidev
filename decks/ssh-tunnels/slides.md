---
theme: ../../themes/forest
title: SSH tunnels - Ports, paths, and perspective
layout: cover
info: |
  A practical guide to local, remote, and dynamic SSH forwarding, based on
  Ivan Velichko's iximiuz Labs tutorial, with original Excalidraw diagrams.
author: Canh Dinh
mdc: true
duration: 60min
---

# SSH tunnels

Access services where they already run using SSH port forwarding.

<div class="cover-meta">
  <span class="author-line">Canh Dinh</span>
  <ul class="topic-tags" aria-label="Topics">
    <li>Local forwarding</li>
    <li>Remote forwarding</li>
    <li>SOCKS</li>
    <li>Jump hosts</li>
  </ul>
  <span>Based on iximiuz Labs · OpenSSH settings reviewed 25 Oct 2026</span>
</div>

<div class="footer-note">SSH listens on one side and connects to the service from the other.</div>

<!--
Audience: developers comfortable with a terminal and basic IP addresses and ports.
Allow about an hour with discussion, or longer if participants do the linked labs.
The examples use the tutorial's hostnames and network addresses, not live public services.
-->

---

# When a tunnel is the right tool

- Open a remote VM's loopback-only admin UI in your own browser.
- Reach a private database or API through an approved bastion.
- Let a remote machine reach a local dev server without inbound access to your laptop.
- Use several internal endpoints through one SOCKS proxy.

Use it for scoped, authorized access. For team-wide, always-on connectivity, an access gateway or VPN is usually easier to govern.

<!--
Tunneling changes the access path, not the application's location. It is especially useful
for short-lived debugging and administration. Do not present it as a way to bypass organizational policy.
-->

---

# How an SSH tunnel works

An SSH tunnel carries application byte streams inside an authenticated, encrypted SSH connection.

1. SSH creates a listening socket on one side.
2. An application connects to that socket.
3. The other side opens a TCP connection to the target and relays bytes in both directions.

One SSH transport can carry many forwarding channels. Each forwarded TCP connection uses a channel within that transport, with no extra SSH login.

The target needs no SSH support, and forwarding works without a remote shell.

<!--
These are TCP/application-proxy examples, not IP routing. SSH also has Unix-socket forwarding
and separate tun-device features, which are outside this deck's scope.
-->

---
class: diagram-slide
---

# Follow the three TCP connections

![An application connects to an SSH endpoint, a middle SSH transport joins client and server, and the opposite endpoint connects to the target. Only the middle leg is encrypted by SSH.](/diagrams/anatomy.svg)

`-L` / `-D`: listen on the client; connect from the server.<br>
`-R`: listen on the server; connect from the client.

The SSH client starts the SSH session in every mode.

<!--
In reverse forwarding, the application and target swap sides relative to the SSH roles.
Data and responses are bidirectional regardless of which side initiated either connection.
The diagram is a role model; it does not imply that every target is on the SSH server itself.
-->

---
class: table-slide
---

# The lab network

Adapted from the [iximiuz Labs tutorial](https://labs.iximiuz.com/tutorials/ssh-tunnels).

| Host | Addresses | Role |
| --- | --- | --- |
| `local` | `192.168.0.20`, `203.0.113.20` | Your workstation; runs `ssh` |
| `remote` | `203.0.113.30`, `172.16.0.30` | Public bastion / gateway; runs `sshd` |
| `private` | `172.16.0.40` | VPC service, no public route |
| `private-2` | `172.16.0.50` | A second VPC service |
| `internal` | `192.168.0.10` | Home-network device |

`local` can SSH to `remote`. Only `remote` can directly reach the VPC; only `local` can directly reach the home network.

<!--
203.0.113.0/24 is a documentation network, not an Internet destination to try from your own laptop.
The tutorial provides a simulated public network and prepared SSH accounts. Outside it, substitute
real, authorized hosts and your SSH username. Hostnames here refer to that lab's hosts.
-->

---
class: table-slide
---

# Which side needs the listener?

| Need | Listener lives on | Destination chosen | Mode |
| --- | --- | --- | --- |
| Use one server-side service locally | SSH client | In the command | `-L` |
| Use one client-side service remotely | SSH server | In the command | `-R` |
| Use many server-side services locally | SSH client | By each SOCKS request | `-D` |
| Use many client-side services remotely | SSH server | By each SOCKS request | `-R` without target |

Local means the SSH client; remote means the SSH server.

<!--
The left side of a forwarding specification is the new listener. The destination can be on
the SSH endpoint itself or another host reachable from it. Dynamic forwarding requires a SOCKS-aware app.
-->

---

# Before the first command

- You need an SSH account, a verified server host key, and a route to its SSH port.
- Both server policy and SSH key restrictions must allow the forward.
- The connecting side must be able to resolve and reach the target.
- Choose a bind address and an unused port on the listening side.

```bash
ssh -V                 # identify your OpenSSH client
ssh remote             # verify login and the host-key fingerprint
```

Examples use explicit IPv4 loopback and high ports. Start in the foreground so errors remain visible.

<!--
Compare the server's host-key fingerprint with one obtained through a trusted channel.
Most examples assume modern OpenSSH on Linux/macOS or Windows OpenSSH. Inspection commands using
ss, systemctl, and sshd are Linux examples. Tunnel commands do not change your SSH server's policy.
-->

---
class: diagram-slide
---

# `-L` brings a remote port to your machine

![On local, curl connects to ssh listening on 127.0.0.1:8080. SSH carries the stream to remote, whose sshd connects to its own 127.0.0.1:80 web service.](/diagrams/local.svg)

```bash
# Run on local; keep this terminal open
ssh -NT -L 127.0.0.1:8080:127.0.0.1:80 remote
# In another local terminal
curl http://127.0.0.1:8080
```

`127.0.0.1:80` means remote's loopback. No public web listener is needed.

<!--
This is tutorial Lab 1 with an explicit bind address and foreground operation. -N sends no remote
command and -T disables pseudo-terminal allocation. Ctrl-C stops this forwarding session.
-->

---
layout: two-cols-header
---

# Read `-L` from left to right

```text
ssh -L [bind_address:]listen_port:target_host:target_port ssh_server
```

::left::

## Listener: on the SSH client

`127.0.0.1:8080`

Your app connects here. The bind address belongs to an interface on your client, not on the target.

::right::

## Target: from the SSH server

`127.0.0.1:80`

The server opens this connection. The last argument, `remote`, selects the SSH server; it need not be the target host.

::bottom::

Remember the order as `-L local-listener:server-side-target`.

---
class: diagram-slide
---

# A bastion can connect to another host

![A local listener on 8081 tunnels to the remote bastion. The bastion opens an ordinary TCP connection to the private VPC host at 172.16.0.40:80.](/diagrams/bastion.svg)

```bash
# Run on local
ssh -NT -L 127.0.0.1:8081:172.16.0.40:80 remote
curl http://127.0.0.1:8081  # in another local terminal
```

The target needs no SSH server. It must accept connections from the bastion.

<!--
Tutorial Lab 2. For a hostname instead of an IP, the bastion performs target DNS resolution.
Target firewalls and security groups see the bastion's outgoing connection, not the laptop's IP.
The final TCP hop is outside the SSH encryption boundary; use application TLS when needed.
-->

---
class: diagram-slide jump-slide
---

# `-J` reaches a private host's own loopback

![Local forwards 8082 through a bastion using ProxyJump. The inner SSH connection terminates on private, whose sshd can connect to its own loopback web port 9000. The bastion only relays the inner session.](/diagrams/jump.svg)

```bash
# Run on local; requires SSH access to private as well as remote
ssh -NT -J remote \
  -L 127.0.0.1:8082:127.0.0.1:9000 private
curl http://127.0.0.1:8082  # in another local terminal
```

`-J remote` routes SSH through the jump host; `private` is where the session ends.

<!--
Tutorial Lab 3. A direct -L to 172.16.0.40:9000 through remote will not reach a service bound only
to private's loopback. The final SSH session must end on private. Local authenticates to both
hosts and verifies both host keys. The bastion needs to permit the jump connection to private:22.
Agent forwarding (-A) is not necessary; use local keys, host aliases, or your local agent.
-->

---
class: table-slide
---

# Whose `localhost` is it?

| Command fragment | Who resolves / connects to the target? | `127.0.0.1` means |
| --- | --- | --- |
| `-L 8080:127.0.0.1:80 remote` | `remote` | `remote` itself |
| `-J remote -L 8082:127.0.0.1:9000 private` | `private` | `private` itself |
| `-R 8080:127.0.0.1:3000 remote` | `local` | `local` itself |

A loopback service is reachable only inside that host's network namespace.

Using the private host's network IP does not reach its loopback. A container's `127.0.0.1` is not the host's `127.0.0.1` either.

---

# Connect to a private PostgreSQL server

```bash
# Run on your workstation; substitute your real bastion and DB
ssh -NT -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:15432:db.internal:5432 alice@bastion.example

# Another terminal: connect locally, verify the real DB identity
psql "host=db.internal hostaddr=127.0.0.1 port=15432 \
sslmode=verify-full sslrootcert=/path/to/db-ca.pem dbname=app"
```

- The bastion must resolve `db.internal` and reach port `5432`.
- PostgreSQL uses `hostaddr` for transport and `host` for certificate identity.
- Database login and TLS verification still apply. SSH is not database authentication.

<!--
Use the actual DB CA file and hostname from your environment. libpq supports host plus hostaddr
to separate the TCP destination from the TLS hostname. Other GUI clients/drivers may expose
equivalent settings or built-in SSH tunneling. Do not suggest disabling certificate verification.
-->

---
class: diagram-slide
---

# `-R` puts the listener on the gateway

![On remote, curl connects to sshd listening on 127.0.0.1:8080. The request crosses SSH back to local, whose SSH client opens local 127.0.0.1:3000. Local initiates the SSH session.](/diagrams/remote.svg)

```bash
# Run on local, where your dev app listens on port 3000
ssh -NT -R 127.0.0.1:8080:127.0.0.1:3000 remote
# Run on remote
curl http://127.0.0.1:8080
```

With the default server policy, only processes on the gateway can use that listener.

<!--
Adapted from tutorial Lab 4; use 80 instead of 3000 for its prepared local web server.
The deck starts with a loopback-only listener rather than the tutorial's public listener.
Existing sshd GatewayPorts yes would override loopback and force a wildcard bind: verify policy.
No inbound connection to the laptop is required. The outgoing SSH connection must remain alive.
-->

---
class: diagram-slide
---

# `-R` can reach your home network too

![Remote's loopback listener on 8081 forwards through SSH to local, which opens a TCP connection to internal at 192.168.0.10:80 on the home network.](/diagrams/home.svg)

```bash
# Run on local, which can reach both the gateway and the home host
ssh -NT -R 127.0.0.1:8081:192.168.0.10:80 remote
# Run on remote
curl http://127.0.0.1:8081
```

The SSH client opens the target connection, either to itself or to another host it can reach.

<!--
Tutorial Lab 5, deliberately loopback-scoped here. This works across ordinary NAT because the
workstation initiates the SSH connection outward, subject to egress policy. It does not create
a route to the home subnet; it creates access to this one TCP endpoint.
-->

---
class: table-slide
---

# `GatewayPorts`: two different settings

| File / side | Setting | Effect |
| --- | --- | --- |
| `~/.ssh/config` on client | `GatewayPorts no` (default) | Default local `-L` / `-D` binds are loopback; use explicit binds to avoid ambiguity |
| `sshd_config` on server | `GatewayPorts no` (default) | Forces remote `-R` listeners to loopback |
| `sshd_config` on server | `GatewayPorts yes` | **Forces wildcard binds**, even if the client asks for loopback |
| `sshd_config` on server | `GatewayPorts clientspecified` | Allows the client to choose the `-R` bind address |

Use `clientspecified` when you need non-loopback remote access. An explicit client bind cannot override a restrictive or wildcard-forcing server policy.

<!--
The tutorial uses GatewayPorts yes to demonstrate public access. clientspecified provides more
precise listener control. Client ssh -g concerns local forwards; it does not turn on public -R access.
These names live in separate manuals and have different allowed values and responsibilities.
-->

---

# Allowing access from other machines

To share an approved demo, allow the exact listener in server policy and firewall rules.

```bash
# Server must allow this bind, e.g. GatewayPorts clientspecified
# Run on local; use the gateway interface your audience can reach
ssh -NT -o ExitOnForwardFailure=yes \
  -R 203.0.113.30:8080:127.0.0.1:3000 remote
```

- A bind address selects an interface; use a firewall to restrict which clients can connect.
- SSH does not add HTTPS or viewer authentication to this published port.
- For public web access, prefer a loopback tunnel behind an authenticated TLS reverse proxy.

**Never publish an unauthenticated database, debug port, or SOCKS proxy by accident.**

<!--
This is an illustrative lab address, not a command to run against a real Internet gateway.
0.0.0.0 would listen on every IPv4 interface, including private interfaces; avoid it when a single
interface is sufficient. A changed firewall or server config can expand exposure independently.
-->

---
class: diagram-slide
---

# `-D` lets each request choose a destination

![A SOCKS-aware application connects to local's SSH SOCKS listener on 1080. The SSH server on remote connects to either private VPC host according to the destination requested by the application.](/diagrams/dynamic.svg)

```bash
# SOCKS-aware applications only; run on local
ssh -NT -D 127.0.0.1:1080 remote
# Another local terminal; request either VPC host through the proxy
curl --socks5-hostname 127.0.0.1:1080 http://172.16.0.40
curl --socks5-hostname 127.0.0.1:1080 http://172.16.0.50
```

<!--
Tutorial Lab 6. The proxy provides access only to destinations the server can reach and server
policy permits; it is not unrestricted access to every port. OpenSSH supports SOCKS4 and SOCKS5
TCP forwarding. It does not provide SOCKS username/password authentication or SOCKS5 UDP relay.
-->

---
layout: two-cols-header
---

# DNS resolution through SOCKS

::left::

## Resolve through the tunnel

```bash
curl --proxy socks5h://127.0.0.1:1080 \
  https://api.internal
```

`socks5h` / `--socks5-hostname` sends the hostname in the SOCKS request. For `-D`, the SSH server resolves it.

::right::

## Configure the application

- Set your browser's SOCKS5 host and port. Enable proxy DNS if supported.
- `socks5://` / `--socks5` in curl resolves the target on the client instead.
- Check proxy bypass lists, DNS behavior, and apps that ignore proxy settings.

::bottom::

SOCKS settings apply to each app. Traffic outside the proxy still uses normal routes; SOCKS does not create a system-wide VPN.

<!--
Use actual internal names and valid certificates in your environment. Browser settings vary;
do not imply one DNS checkbox covers every browser protocol. HTTP/3, WebRTC, helper apps, and
proxy exclusions need separate verification before relying on a proxy for traffic containment.
-->

---
class: diagram-slide
---

# Reverse SOCKS: `-R` without a target

![A SOCKS application on remote enters a loopback listener on 1080. SSH carries the SOCKS request to the local SSH client, which resolves and reaches home-network or local-loopback destinations.](/diagrams/reverse-dynamic.svg)

```bash
# Run on local; OpenSSH client 7.6+ required
ssh -NT -R 127.0.0.1:1080 remote
# Run on remote
curl --socks5-hostname 127.0.0.1:1080 http://192.168.0.10
```

The server listens; the SSH client processes SOCKS requests and connects to the target.

<!--
Tutorial Lab 7, with a deliberately loopback-scoped listener. The server creates a normal remote
forwarded listener, but the modern local client interprets the SOCKS protocol. This is more precise
than saying that sshd itself performs the SOCKS negotiation. No new server version is required
just for the SOCKS processing, though policies and individual restrictions are version dependent.
-->

---

# Limit what reverse SOCKS can reach

Other processes and users on the gateway can use its loopback listener.

```bash
# Run on local; modern OpenSSH supports this client-side allowlist
ssh -NT -o ExitOnForwardFailure=yes \
  -o PermitRemoteOpen=192.168.0.10:80 \
  -R 127.0.0.1:1080 remote
```

- `PermitRemoteOpen` restricts destinations for remote dynamic forwarding.
- It lives in `ssh_config` / `ssh -o`, not in `sshd_config`.
- Match the requested host exactly; names and IPs are not interchangeable allowlist entries.

Do not expose it as a public proxy. Review who can run code on the gateway.

<!--
PermitRemoteOpen is a separate, newer feature than reverse SOCKS itself. Check your installed
client manual and ssh -G output for support. The default permits any destination; the example
allows only the one IP and port. It is not a restriction for fixed-destination -R forwards.
-->

---
class: table-slide
---

# Where each forwarding mode connects

| Mode | New socket | Target TCP connection / DNS | App needs SOCKS? |
| --- | --- | --- | --- |
| `-L bind:port:host:port` | On client | From server | No |
| `-R bind:port:host:port` | On server | From client | No |
| `-D bind:port` | On client | From server¹ | Yes |
| `-R bind:port` | On server | From client¹ | Yes |

Applications enter through the listener. The other SSH endpoint connects to the target.

¹ With SOCKS, the name reaches that side only if the app sends a hostname rather than a locally resolved IP.

---
class: table-slide
---

# Options for forwarding sessions

| Option | What it does | Practical use |
| --- | --- | --- |
| `-N` | Sends no remote command | Forwarding-only session |
| `-T` | Disables pseudo-terminal allocation | No terminal needed for a tunnel |
| `-f` | Backgrounds after authentication | Use only after foreground verification |
| `-o ExitOnForwardFailure=yes` | Exits if requested forwarding setup fails | Catch denied / occupied listeners |

Use `-p 2222` for a custom SSH server port and `-i keyfile` to select an identity. Neither changes the target service's port.

SSH may set up the listener successfully, then fail to reach the target when an app connects.

<!--
ExitOnForwardFailure defaults to no. It detects setup failures such as bind errors, but does not
exit when a later forwarded connection cannot reach its target. -f implies -n (stdin from /dev/null).
There is no need to add -f to a service manager; keep its child in the foreground.
-->

---
layout: two-cols-header
---

# Save tunnel settings in `~/.ssh/config`

::left::

```ssh-config
Host vpc-web
  HostName 203.0.113.30
  User alice
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  LocalForward 127.0.0.1:8081 172.16.0.40:80
  ExitOnForwardFailure yes
  ServerAliveInterval 30
  ServerAliveCountMax 3
```

::right::

```bash
ssh -NT vpc-web

# Print effective client configuration
ssh -G vpc-web
```

Use a dedicated tunnel alias so routine logins do not unexpectedly claim the same listening port.

Keep host-key verification enabled. `IdentitiesOnly` limits offered keys; it does not replace host verification.

<!--
Replace alice and the example identity path as appropriate.
Multiple LocalForward/RemoteForward/DynamicForward lines are possible.
More-specific Host blocks normally belong before broad Host * defaults because most values are first-set-wins.
-->

---

# Detecting a dropped SSH connection

```bash
ssh -NT -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -L 127.0.0.1:8080:127.0.0.1:80 remote
```

- Encrypted SSH probes detect an unresponsive peer in roughly 90 seconds with these values.
- These probes may keep idle network state alive; `TCPKeepAlive` is a different, OS-level mechanism.
- SSH does not automatically reconnect. A managed service or `autossh` can restart a long-lived tunnel.
- Restarting the tunnel does not restore old application TCP sessions. Apps must reconnect.

For a persistent tunnel, use a supervisor. Otherwise, run it in the foreground and stop it with `Ctrl-C`.

---
layout: two-cols-header
---

# Stopping a tunnel

::left::

## Short-lived tunnel

Run in the foreground while debugging.

```bash
ssh -NT -L 127.0.0.1:8080:127.0.0.1:80 remote
```

`Ctrl-C` closes the listener and its forwarding session. Avoid `killall ssh`: it stops unrelated work too.

::right::

## Explicit control socket

```bash
ssh -M -S ~/.ssh/vpc-web.sock -fNT \
  -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:8080:127.0.0.1:80 remote
ssh -S ~/.ssh/vpc-web.sock -O check remote
ssh -S ~/.ssh/vpc-web.sock -O exit remote
```

Keep the socket in your private `~/.ssh` directory. Exiting a master closes all channels using it.

<!--
Use a distinct, currently unused control-socket path for this example. Existing ControlMaster,
ControlPath, and ControlPersist settings may cause a regular invocation to reuse a master;
inspect effective config when lifecycle behavior is surprising. This is an optional operations pattern,
not a prerequisite for forwarding. Do not remove an existing socket without checking its owner/session.
-->

---
class: diagram-slide
---

# The limits of SSH encryption

![SSH protects only local to bastion. The application-to-listener leg and bastion-to-private-service leg are separate TCP connections, outside SSH's encryption.](/diagrams/bastion.svg)

- SSH encrypts traffic between its client and final SSH server.
- Keep application TLS for the last network hop and verify the service's real hostname.
- The service sees the connector's source IP, not the original application's IP.

`-J` carries the inner SSH session through the bastion to the final SSH server.

<!--
Loopback legs do not cross a physical network but still lie outside the SSH transport. An untrusted
SSH server can inspect plaintext application traffic after decrypting SSH; end-to-end TLS provides
additional protection. The bastion in a ProxyJump path relays the inner encrypted SSH session.
-->

---
layout: two-cols-header
---

# Server policy for local forwarding

::left::

```ssh-config
# On remote: sshd_config policy fragment
Match User tunnel-web
  AllowTcpForwarding local
  PermitOpen 172.16.0.40:80
  AllowAgentForwarding no
  X11Forwarding no
  PermitTTY no
  MaxSessions 0
```

::right::

- `local` allows client-side `-L` / `-D`, not `-R`.
- `PermitOpen` restricts the server-side TCP destination, including requests through `-D`.
- `MaxSessions 0` prevents shell, command, and subsystem sessions while still permitting forwarding.
- These permissions apply to this account; configure its authentication separately.

::bottom::

`PermitOpen` matches literal host/port strings, with no DNS equivalence. Use the destination string clients will request.

<!--
This is an illustrative policy fragment, not a complete hardened server configuration. Provision the
dedicated account and its authorized key separately and check other key/certificate restrictions.
For ProxyJump, the jump account must be allowed to connect to the final host's SSH port, not only
the web service port. Restricting forwarding on a normal shell-capable account does not prevent
that user implementing another proxy with their shell, which is why shell access is addressed here.
-->

---
layout: two-cols-header
---

# Server policy for remote forwarding

::left::

```ssh-config
# On remote: sshd_config policy fragment
Match User tunnel-demo
  AllowTcpForwarding remote
  GatewayPorts clientspecified
  PermitListen 127.0.0.1:8080
  AllowAgentForwarding no
  X11Forwarding no
  PermitTTY no
  MaxSessions 0
```

::right::

- `remote` allows `-R`, not client-side `-L` / `-D`.
- `PermitListen` restricts where the remote socket may listen.
- The permitted loopback address must match the client's explicit bind request.
- It does not restrict the destination that the client connects to for fixed `-R`.

::bottom::

`DisableForwarding yes` overrides forwarding permissions. Authorized-key and certificate restrictions may deny access too.

<!--
clientspecified plus a narrow PermitListen lets this account request exactly 127.0.0.1:8080.
The sample does not permit a public listener or the reverse SOCKS port 1080. To deliberately
publish a different address/port, review and change PermitListen and the firewall together.
The omitted-bind name localhost is treated differently from explicit 127.0.0.1 / ::1 in PermitListen.
-->

---

# Validate server changes without losing access

```bash
# Linux server examples; substitute the real account and client IP
sudo sshd -t
sudo sshd -T -C user=tunnel-web,host=local,addr=203.0.113.20 \
  | rg 'allowtcpforwarding|gatewayports|permitopen|permitlisten|maxsessions'

# Only after validation; unit name varies by distribution
sudo systemctl reload sshd
```

- Keep an existing admin session open; test a fresh connection before closing it.
- Check which `Match` blocks, included files, and key restrictions apply.
- Reconnect the tunnel after a reload so the new policy applies.

<!--
Some distributions call the service ssh, not sshd, and sshd may need its absolute path.
sshd -T -C evaluates connection-specific Match conditions: include additional context such as
laddr/lport when your configuration uses those conditions. rg is just a text filter; use grep -E
if ripgrep is not installed. A server-wide policy rollout needs its own change and rollback plan.
-->

---
class: table-slide
---

# Choose the listener's bind address

| Address / situation | Meaning | Caveat |
| --- | --- | --- |
| `127.0.0.1` | IPv4 loopback | Other local processes can connect too |
| `::1` | IPv6 loopback | Separate from IPv4; use bracketed IPv6 in specs |
| `0.0.0.0` | Every IPv4 interface | May include untrusted networks |
| `localhost` | Name for loopback | IPv4/IPv6 selection can differ |
| Container / VM / WSL | Its own networking context | Its loopback may not be your browser's loopback |

Verify actual sockets with `ss -ltnp` on the listening machine.

<!--
Example of unambiguous IPv6 syntax: ssh -NT -L '[::1]:8080:[::1]:80' remote.
Whether IPv6 wildcard sockets also accept IPv4 is OS/config dependent; inspect both families.
Ports below 1024 often require elevated privileges or capabilities. Prefer a high listener port
instead of running your SSH client as root. Loopback is host-local, not a per-user access control.
-->

---
layout: two-cols-header
---

# Protocol and application limits

::left::

## TCP support

- These modes relay TCP, not UDP, ICMP, or arbitrary IP packets.
- SOCKS5 UDP and HTTP/3 / QUIC are not carried by OpenSSH's SOCKS proxy.
- Apps using callbacks, extra data ports, or service discovery may need more than one forward.

::right::

## Application behavior

- A raw port forward does not rewrite HTTP `Host`, redirects, or TLS SNI.
- Connecting to `https://localhost:8080` can fail certificate checks for a remote hostname.
- App authentication, authorization, and timeouts remain in effect.

::bottom::

For HTTP testing, preserve hostname and TLS: `curl --connect-to app.internal:443:127.0.0.1:8443 https://app.internal` with a matching `-L` to `app.internal:443`.

<!--
Use a trusted CA as needed; do not use curl -k to hide hostname or trust errors. The curl
--connect-to example changes only the TCP endpoint, preserving the URL hostname for TLS and HTTP.
All channels sharing one SSH TCP transport are affected by its congestion, packet loss, and failure;
it is not automatically a high-throughput replacement for direct application connectivity.
-->

---

# Debug one leg at a time

1. Can the SSH client authenticate to the intended server?
2. Is the listener bound to the expected address and port on the correct machine?
3. Can the connector resolve and reach the target directly?
4. Do TLS, HTTP hostnames, credentials, and proxy settings match the application?

```bash
# Run on local: watch errors while sending a request in another terminal
ssh -vvv -NT -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:8081:172.16.0.40:80 remote
# Run on remote: test the destination leg independently
curl --connect-timeout 3 http://172.16.0.40:80
```

For `-R`, test target reachability from the client instead. Redact hostnames and usernames before sharing verbose logs.

---
class: table-slide
---

# Symptoms: listener and policy

| Symptom | Likely cause | Next check |
| --- | --- | --- |
| `Address already in use` | Another process owns the listener | Inspect `ss -ltnp`; pick an unused port |
| `remote port forwarding failed` | Denied remote bind or port conflict | Check remote sockets, `PermitListen`, and server logs |
| `administratively prohibited` | Forwarding policy denied a channel | Check `AllowTcpForwarding`, `PermitOpen`, key restrictions |
| Gateway works; another host cannot connect | Loopback bind, firewall, or no route | Inspect actual bind and server `GatewayPorts` policy |

Find the failing TCP leg before binding `0.0.0.0` or opening the firewall.

---
class: table-slide
---

# Symptoms: target and application

| Symptom | Likely cause | Next check |
| --- | --- | --- |
| Tunnel starts; request says connection refused | No service on target address/port | Test from the connector side; check loopback vs network IP |
| Request hangs or times out | Firewall, routing, or dead transport | Check each TCP leg and keepalive behavior |
| IP works; internal hostname fails | DNS on the wrong side | Verify connector DNS; use SOCKS remote-name resolution |
| TLS error, wrong site, or redirect | Hostname / SNI / HTTP behavior | Preserve the service hostname and trusted CA |

The listener can exist while the target is unreachable. Test with an application request through the tunnel.

---

# Practice: predict the listener and connector

Use the [tutorial's prepared playground](https://labs.iximiuz.com/tutorials/ssh-tunnels); no real production services needed.

1. Make `remote`'s loopback web server available on local `8080`.
2. Reach `private`'s loopback debug port `9000` from local `8082`.
3. Make `internal:80` available only on remote's loopback `8081`.
4. Reach both VPC web servers through one local proxy.

For each command, identify the listener, connector, DNS resolver, and encrypted leg.

The tutorial preconfigures `GatewayPorts yes` for its public `-R` labs. Do not assume its remote listeners stay loopback-only; inspect the policy and actual sockets.

<!--
The main deck shows safer loopback-scoped remote commands under no/clientspecified policies.
The tutorial's automatic reverse-forward checks expect its own published listener examples;
do not promise that the safer variant satisfies those checks without adapting the sandbox policy.
Use the tutorial commands for its public-listener exercises in that disposable lab only.
-->

---

# Practice solutions

```bash
# 1. Listener on local; connector on remote
ssh -NT -L 127.0.0.1:8080:127.0.0.1:80 remote

# 2. Listener on local; connector on private, reached via remote
ssh -NT -J remote -L 127.0.0.1:8082:127.0.0.1:9000 private

# 3. Listener on remote; connector on local (requires suitable bind policy)
ssh -NT -R 127.0.0.1:8081:192.168.0.10:80 remote

# 4. SOCKS listener on local; connector on remote
ssh -NT -D 127.0.0.1:1080 remote
```

Use a second terminal on the listener side to test each tunnel, then stop the session.

---

# Command reference

```bash
# Fixed destination, listener on client
ssh -NT -L 127.0.0.1:8080:TARGET:80 SERVER

# Fixed destination, listener on server
ssh -NT -R 127.0.0.1:8080:TARGET:80 SERVER

# Per-request destination, local SOCKS entry
ssh -NT -D 127.0.0.1:1080 SERVER

# Per-request destination, remote SOCKS entry (client 7.6+)
ssh -NT -R 127.0.0.1:1080 SERVER
```

Add `-o ExitOnForwardFailure=yes` for setup failures. Use a `-J JUMP` path when SSH must end on a host behind a bastion. Check server policy before relying on a remote bind.

---

# Check the tunnel before using it

- Confirm that the listener and target are on the intended machines.
- Check that binds, firewall rules, and SSH permissions limit access as intended.
- Verify SSH host keys, application TLS, and app credentials.
- Send a real request and check target failure and disconnect behavior.
- Know how to stop the tunnel and whether it will restart.

---
class: references-slide
---

# Sources

- [Ivan Velichko: SSH Tunnels, iximiuz Labs](https://labs.iximiuz.com/tutorials/ssh-tunnels): scenarios, network topology, and seven hands-on labs.
- [OpenSSH `ssh(1)`](https://man.openbsd.org/ssh): `-L`, `-R`, `-D`, `-J`, and runtime options.
- [OpenSSH `ssh_config(5)`](https://man.openbsd.org/ssh_config): client binds, keepalives, `ExitOnForwardFailure`, and `PermitRemoteOpen`.
- [OpenSSH `sshd_config(5)`](https://man.openbsd.org/sshd_config): server `GatewayPorts`, `AllowTcpForwarding`, `PermitOpen`, and `PermitListen`.
- [PostgreSQL connection parameters](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-PARAMKEYWORDS) and [curl manual](https://curl.se/docs/manpage.html): hostname-preserving client examples.

Examples are adaptations, not exact copies of lab instructions. Consult the manual shipped with your OpenSSH version before applying policy.
