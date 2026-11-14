-- Redsocks2 高级配置页面
m = Map("redsocks2", "Redsocks2 - 高级设置", "以下为 Redsocks2 原有高级参数。当前 HTTPS 透明代理的常用配置请在“基本设置”页面完成。")

s = m:section(TypedSection, "redsocks2_autoproxy", "自动代理设置")
s.anonymous = true

o = s:option(Value, "no_quick_check_seconds", "直连超时时间（秒）")
o.datatype = "uinteger"

o = s:option(Value, "quick_connect_timeout", "快速检测超时时间（秒）")
o.datatype = "uinteger"

s = m:section(TypedSection, "redsocks2_ipcache", "IP 缓存设置")
s.anonymous = true

o = s:option(Value, "cache_size", "最大缓存记录数（千条）")
o.datatype = "uinteger"

o = s:option(Value, "cache_file", "缓存文件路径")

o = s:option(Value, "stale_time", "缓存有效时间（秒）")
o.datatype = "uinteger"

o = s:option(Value, "autosave_interval", "自动保存间隔（秒）")
o.datatype = "uinteger"

o = s:option(Flag, "port_check", "启用基于端口的 IP 缓存")
o.rmempty = false

return m
