# Redsocks2 HTTPS 透明代理（ImmortalWrt 24.10）

面向 OpenWrt / ImmortalWrt 的 LuCI 透明代理管理插件。基于 Redsocks2，将局域网设备的 IPv4 TCP 流量转发到配置的上游代理；支持 HTTPS CONNECT（TLS）、多节点管理、节点测速、订阅/文本导入，以及中国大陆 IPv4 网段自动直连。

> 当前发布版本：**LuCI 插件 1.0.3-r16**。本次 r16 更新调整了 LuCI 基本设置页面的字段名称和显示逻辑，**没有修改 Redsocks2 核心源码**。TXT 上传页面保持原有行为：上传后自动检测裸 IP:端口节点的协议，不需要手动选择协议。

## 当前版本下载

<badge>r16 · 编译成功</badge>

适用目标：ImmortalWrt 24.10 / MediaTek Filogic / aarch64 Cortex-A53，例如 360 T7（MT7981）。

- [下载 LuCI 管理插件](https://github.com/822233/luci-app-redsocks2/releases/latest/download/luci-app-redsocks2_1.0.3-r16_all.ipk)
- [下载 Redsocks2 核心](https://github.com/822233/luci-app-redsocks2/releases/latest/download/redsocks2_20170730-r3_aarch64_cortex-a53.ipk)
- [下载 SHA256 校验文件](https://github.com/822233/luci-app-redsocks2/releases/latest/download/SHA256SUMS)
- [查看全部 Releases](https://github.com/822233/luci-app-redsocks2/releases)

如果路由器已经安装了正常工作的 Redsocks2 核心，升级 r16 时通常只需安装 LuCI 管理插件；新装系统则需要安装核心和 LuCI 插件两个 IPK。核心包随本次构建提供，但核心源码没有因 r16 界面调整而改变。

## 功能

### 代理节点管理

- 支持添加、编辑、删除多个代理节点。
- 支持 HTTPS CONNECT（TLS）、HTTP CONNECT、SOCKS4、SOCKS5，以及导入器支持的 Shadowsocks 分享链接格式。
- 节点可配置服务器、端口及可选用户名/密码。
- 可选择当前生效节点，保存或导入后按页面逻辑应用配置并重启服务。
- 旧版单节点配置可迁移为默认节点。

### 订阅与 TXT 导入

- 支持粘贴单条或多条节点分享链接。
- 支持上传 TXT 文件批量导入。
- 裸 IP:端口条目由导入程序自动检测 HTTP CONNECT、HTTPS CONNECT、SOCKS4 或 SOCKS5；分享链接根据协议格式解析。
- 自动提取节点名称、服务器、端口和认证信息；重复节点去重，不支持的条目会跳过并报告。
- TXT 上传页面使用自动检测，不需要额外选择协议。

### 节点测速

- 支持单节点测速和全部节点顺序测速。
- 网页可用性测试通过代理发起真实 HTTPS 请求。
- 下载测速通过同一代理下载测试文件，计算实际速度（MB/s）。
- 页面展示可用状态、网页响应时间和下载速度，便于手动选择节点。
- 测速由路由器本机发起，不会再次进入 LAN 透明代理重定向规则；节点逐个测试，避免低功耗设备承受过高并发负载。

### 透明代理与国内 IPv4 直连

- 使用 nftables / Firewall4 实现透明转发，适配 ImmortalWrt 24.10。
- 支持中国大陆 IPv4 CIDR 列表自动下载、校验和定期更新。
- 命中国内 IPv4 网段的流量直连，其他公网 IPv4 TCP 流量按规则转发到代理。
- 私有地址、回环地址、链路本地地址、运营商级 NAT 地址及组播地址默认直连。
- 国内网段列表更新失败时保留已有文件，避免因下载失败覆盖有效数据。

## 支持范围与限制

- **仅支持 IPv4 TCP 透明代理。**
- 不支持 UDP、QUIC，也不提供 IPv6 透明代理。
- 当前不会自动切换节点；请根据测速结果手动选择。
- 国内 IPv6 流量不由当前 IPv4 网段列表处理。
- 当前 Redsocks2 HTTPS CONNECT 实现未校验代理服务器证书；测速行为与核心保持一致。请只连接可信任的代理服务器。目标网站的 HTTPS 证书仍由 curl 正常校验。

## 安装与升级

将 IPK 上传到路由器的 `/tmp` 目录，通过 SSH 安装。

**首次安装：**

```sh
opkg install /tmp/redsocks2_20170730-r3_aarch64_cortex-a53.ipk /tmp/luci-app-redsocks2_1.0.3-r16_all.ipk
```

**已安装核心，仅升级 LuCI 插件：**

```sh
opkg install /tmp/luci-app-redsocks2_1.0.3-r16_all.ipk
```

如果提示依赖缺失，请先配置可用的软件源并安装相应依赖。安装或升级完成后刷新 LuCI 页面，再进入“服务 → Redsocks2”。

> IPK 与目标平台、CPU 架构及固件版本有关。其他架构或不同 OpenWrt / ImmortalWrt 版本不保证兼容，请勿直接混装。

## 编译

仓库通过 GitHub Actions 使用 ImmortalWrt 24.10 `mediatek/filogic` SDK 编译：

- `redsocks2`：代理转发核心。
- `luci-app-redsocks2`：LuCI 管理界面。
- 推送到开发分支或向 `master` / `immortalwrt-24.10-https` 提交 Pull Request 时会触发编译检查，不会自动覆盖现有 Release。
- 只有推送与 Makefile 版本一致的标签（例如 `v1.0.3-r16`）才会发布 GitHub Release；标签格式必须为 `v{PKG_VERSION}-r{PKG_RELEASE}`。
- 也可以在 Actions 页面手动触发编译，手动构建只生成构建产物，不发布 Release。

[查看 GitHub Actions 编译记录](https://github.com/822233/luci-app-redsocks2/actions)

CI 编译通过和 IPK 结构检查不等于所有路由器上的实机功能验证；请根据设备固件和网络环境完成安装测试。

## 上游与参考

- 原始 LuCI 项目：[hqvv/luci-app-redsocks2](https://github.com/hqvv/luci-app-redsocks2)
- 国内 IPv4 网段数据：[gaoyifan/china-operator-ip](https://github.com/gaoyifan/china-operator-ip)
- 协议自动检测思路参考：[ProxyChecker](https://github.com/faiqsohail/ProxyChecker)

项目地址：[822233/luci-app-redsocks2](https://github.com/822233/luci-app-redsocks2)
