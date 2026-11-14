-- Redsocks2 多协议节点管理页面
local sys = require "luci.sys"
local uci = require "luci.model.uci".cursor()

sys.call("/etc/init.d/redsocks2 migrate >/dev/null 2>&1")

m = Map("redsocks2", "Redsocks2 - 透明代理",
	"管理代理服务和节点。测速与订阅管理请进入“测速与订阅”页面。"
)

local base = m:section(TypedSection, "redsocks2_base", "服务设置")
base.anonymous = true
base.addremove = false

local o = base:option(Flag, "enabled", "启用透明代理")
o.rmempty = false

o = base:option(ListValue, "loglevel", "日志级别")
o:value("off", "关闭")
o:value("info", "普通")
o:value("debug", "调试")
o.default = "info"

o = base:option(ListValue, "active_node", "当前使用节点")
o.rmempty = false
uci:foreach("redsocks2", "redsocks2_node", function(node)
	o:value(node[".name"], node.name or node.ip or node[".name"])
end)

local nodes = m:section(TypedSection, "redsocks2_node", "代理节点列表")
nodes.anonymous = false
nodes.addremove = true
nodes.sortable = true
nodes.template = "cbi/tblsection"

o = nodes:option(Value, "name", "节点名称")
o.rmempty = false
o.placeholder = "例如：香港 01"

o = nodes:option(ListValue, "proxy_type", "代理协议")
o:value("https-connect", "HTTPS CONNECT")
o:value("http-connect", "HTTP CONNECT")
o:value("socks4", "SOCKS4")
o:value("socks5", "SOCKS5")
o:value("shadowsocks", "Shadowsocks")
o.default = "https-connect"
o.rmempty = false

o = nodes:option(Value, "ip", "服务器地址")
o.rmempty = false
o.placeholder = "域名或 IP 地址"

o = nodes:option(Value, "port", "端口")
o.datatype = "port"
o.default = "443"
o.rmempty = false

o = nodes:option(Value, "username", "用户名 / SS 加密方法")
o.rmempty = true
o.description = "Shadowsocks 节点此处填写加密方法，例如 aes-256-gcm、chacha20-ietf-poly1305。"

o = nodes:option(Value, "password", "密码")
o.password = true
o.rmempty = true

local whitelist = m:section(TypedSection, "redsocks2_iptables", "国内地址直连")
whitelist.anonymous = true
whitelist.addremove = false

o = whitelist:option(Flag, "whitelist_enabled", "启用国内 IPv4 网段直连")
o.default = "1"
o.rmempty = false
o.description = "开启后自动下载并每周更新中国大陆 IPv4 网段列表。"

m.on_after_commit = function(self)
	sys.call("/etc/init.d/redsocks2 restart >/dev/null 2>&1")
end

return m
