-- Redsocks2 网页测速与订阅管理
local fs = require "nixio.fs"
local sys = require "luci.sys"
local uci = require "luci.model.uci".cursor()
local util = require "luci.util"

m = Map("redsocks2", "Redsocks2 - 测速与订阅",
	"网页测速会通过代理实际访问 HTTPS 页面并下载测试文件，不使用 TCP 端口探测。订阅仅导入核心支持的协议。"
)

local speed = m:section(TypedSection, "redsocks2_base", "网页测速")
speed.anonymous = true
speed.addremove = false

local new_url = speed:option(Value, "_new_subscription_url", "订阅链接")
new_url.placeholder = "https://example.com/subscribe"
new_url.description = "粘贴订阅链接后点击右侧按钮；订阅名称将优先读取链接末尾的 #名称，没有名称时自动使用网址域名。"
new_url.rmempty = true
new_url.cfgvalue = function()
	return ""
end
-- This is a transient input, not a persistent UCI setting.
new_url.write = function()
end

local add_subscription = speed:option(Button, "_add_subscription", "添加订阅")
add_subscription.inputtitle = "添加订阅"
add_subscription.inputstyle = "add"
add_subscription.write = function(self, section)
	local subscription_url = new_url:formvalue(section)
	if not subscription_url or not subscription_url:match("^https?://[^%s]+$") then
		return
	end

	local subscription_id
	uci:foreach("redsocks2", "redsocks2_subscription", function(entry)
		if entry.url == subscription_url then
			subscription_id = entry[".name"]
		end
	end)

	if not subscription_id then
		local fragment = subscription_url:match("#([^#]*)$")
		local host = subscription_url:match("^https?://([^/%?#]+)")
		if host then
			host = host:gsub("^.-@", ""):gsub(":%d+$", ""):gsub("^www%.", "")
		end
		local name = (fragment and util.urldecode(fragment)) or host or "新订阅"
		name = name:gsub("[|%c]", ""):sub(1, 96)
		if name == "" then name = "新订阅" end

		subscription_id = uci:section("redsocks2", "redsocks2_subscription", nil, {
			name = name,
			url = subscription_url
		})
		if not subscription_id then
			return
		end
		uci:save("redsocks2")
		uci:commit("redsocks2")
	end

	-- Persist the subscription first so the background importer can resolve it by ID.
	sys.call("/usr/bin/redsocks2-subscription " .. util.shellquote(subscription_id) ..
		" >/tmp/redsocks2-subscription-add.log 2>&1 &")
end

local target = speed:option(ListValue, "test_target", "网页测速地址")
target.description = "选择用于检测节点实际网页连通性的目标；自定义地址仅支持 HTTP/HTTPS。"
target:value("google", "Google")
target:value("cloudflare", "Cloudflare")
target:value("baidu", "百度")
target:value("bing", "Bing")
target:value("github", "GitHub")
target:value("custom", "自定义")
target.default = "google"

local custom = speed:option(Value, "test_url", "自定义测速地址")
custom.placeholder = "https://www.example.com/"
custom.description = "选择“自定义”时生效，建议填写可直接返回 HTTP 200 或 204 的网页地址。"
custom.rmempty = true

local all = speed:option(Button, "_test_all", "全部节点测速")
all.inputtitle = "开始全部测速"
all.inputstyle = "apply"
all.write = function()
	sys.call("/usr/bin/redsocks2-speedtest --all >/dev/null 2>&1 &")
end

local ranking = speed:option(DummyValue, "_speed_ranking", "测速速度排名")
ranking.rawhtml = false
ranking.cfgvalue = function()
	local results = {}
	uci:foreach("redsocks2", "redsocks2_node", function(node)
		local data = fs.readfile("/tmp/redsocks2-speedtest-" .. node[".name"])
		if data then
			local status, latency, mbps, code, tested = data:match("^([^|]*)|([^|]*)|([^|]*)|([^|]*)|([^|]*)")
			if status == "OK" then
				results[#results + 1] = { name=node.name or node.ip or node[".name"], latency=latency, speed=tonumber(mbps) or 0, tested=tested }
			end
		end
	end)
	table.sort(results, function(a,b) return a.speed > b.speed end)
	if #results == 0 then return "暂无测速结果。点击上方按钮开始测试。" end
	local lines = {}
	for i,v in ipairs(results) do
		lines[#lines + 1] = string.format("%d. %s | %.2f MB/s | 响应 %s ms | %s", i, v.name, v.speed, v.latency, v.tested)
	end
	return table.concat(lines, "\n")
end

local nodes = m:section(TypedSection, "redsocks2_node", "节点测速")
nodes.anonymous = false
nodes.addremove = false
nodes.template = "cbi/tblsection"

local result = nodes:option(DummyValue, "_test_result", "网页响应时间 / 下载结果")
result.rawhtml = false
result.cfgvalue = function(self, section)
	local data = fs.readfile("/tmp/redsocks2-speedtest-" .. section)
	if not data then return "尚未测速" end
	local status, latency, mbps, code, tested, message = data:match("^([^|]*)|([^|]*)|([^|]*)|([^|]*)|([^|]*)|([^|]*)")
	if status == "OK" then return string.format("可用 | 延迟 %s ms | 下载 %s MB/s | %s", latency, mbps, tested) end
	return "不可用 | " .. (message or "网页请求失败") .. " | " .. (tested or "")
end

local test = nodes:option(Button, "_test_node", "单节点测速")
test.inputtitle = "测速此节点"
test.inputstyle = "apply"
test.write = function(self, section)
	if section and section:match("^[%w_]+$") then
		sys.call("/usr/bin/redsocks2-speedtest " .. section .. " >/dev/null 2>&1 &")
	end
end

local sub = m:section(TypedSection, "redsocks2_subscription", "代理订阅")
sub.anonymous = false
sub.addremove = true
sub.template = "cbi/tblsection"

local name = sub:option(Value, "name", "订阅名称")
name.rmempty = false

local url = sub:option(Value, "url", "订阅地址")
url.rmempty = false
url.placeholder = "https://example.com/subscribe"

local update = sub:option(Button, "_update_subscription", "更新订阅")
update.inputtitle = "立即更新"
update.inputstyle = "apply"
update.write = function(self, section)
	if section and section:match("^[%w_]+$") then
		sys.call("/usr/bin/redsocks2-subscription " .. section .. " >/tmp/redsocks2-subscription.log 2>&1 &")
	end
end

local status = sub:option(DummyValue, "_subscription_status", "最近导入结果")
status.rawhtml = false
status.cfgvalue = function(self, section)
	local data = fs.readfile("/tmp/redsocks2-subscription-" .. section)
	return data or "尚未更新"
end

return m
