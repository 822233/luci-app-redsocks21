-- Redsocks2 配置页面控制器
module("luci.controller.redsocks2", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/redsocks2") then
		return
	end

	entry({"admin", "services", "redsocks2"},
		alias("admin", "services", "redsocks2", "general"),
		"Redsocks2")

	local general = entry({"admin", "services", "redsocks2", "general"},
		view("redsocks2/general-r16"),
		"基本设置", 10)
	general.leaf = true
	general.acl_depends = { "luci-app-redsocks2" }

	entry({"admin", "services", "redsocks2", "speedtest"},
		cbi("redsocks2/speedtest"),
		"测速与订阅", 20).leaf = true

	local import = entry({"admin", "services", "redsocks2", "import"},
		view("redsocks2/import"),
		"批量导入", 25)
	import.leaf = true
	import.acl_depends = { "luci-app-redsocks2" }

	entry({"admin", "services", "redsocks2", "advanced"},
		cbi("redsocks2/advanced"),
		"高级设置", 30).leaf = true
end
