'use strict';
'require view';
'require form';
'require uci';
'require ui';
'require fs';

const PROXY_TYPES = {
	'https-connect': _('HTTPS CONNECT'),
	'http-connect': _('HTTP CONNECT'),
	'socks4': _('SOCKS4'),
	'socks5': _('SOCKS5'),
	'shadowsocks': _('Shadowsocks')
};

return view.extend({
	load: function() {
		return fs.exec('/etc/init.d/redsocks2', [ 'migrate' ])
			.then(function() {
				return uci.load('redsocks2');
			});
	},

	render: function() {
		const m = new form.Map('redsocks2', _('Redsocks2 - 透明代理'),
			_('管理代理服务、节点和国内 IPv4 直连规则。'));

		const base = m.section(form.TypedSection, 'redsocks2_base', _('服务设置'));
		base.anonymous = true;
		base.addremove = false;

		let o = base.option(form.Flag, 'enabled', _('启用透明代理'));
		o.default = '0';
		o.rmempty = false;

		o = base.option(form.ListValue, 'loglevel', _('日志级别'));
		o.value('off', _('关闭'));
		o.value('info', _('普通'));
		o.value('debug', _('调试'));
		o.default = 'info';

		const nodeList = uci.sections('redsocks2', 'redsocks2_node') || [];
		o = base.option(form.ListValue, 'active_node', _('当前使用节点'));
		nodeList.forEach(function(node) {
			o.value(node['.name'], node.name || node.ip || node['.name']);
		});
		o.placeholder = _('请选择节点');
		o.default = nodeList.length ? nodeList[0]['.name'] : '';
		o.rmempty = false;

		const nodes = m.section(form.GridSection, 'redsocks2_node', _('代理节点'));
		nodes.anonymous = true;
		nodes.addremove = true;
		nodes.sortable = true;
		nodes.addbtntitle = _('添加节点');
		nodes.delbtntitle = _('删除节点');
		nodes.modaltitle = function(section_id) {
			const name = uci.get('redsocks2', section_id, 'name') || _('新建节点');
			return _('节点设置：%s').format(name);
		};

		o = nodes.option(form.DummyValue, '_display_name', _('节点名称'));
		o.cfgvalue = function(section_id) {
			return uci.get('redsocks2', section_id, 'name') || _('未命名节点');
		};

		o = nodes.option(form.DummyValue, '_display_type', _('协议'));
		o.cfgvalue = function(section_id) {
			const type = uci.get('redsocks2', section_id, 'proxy_type') || 'https-connect';
			return PROXY_TYPES[type] || type;
		};

		o = nodes.option(form.DummyValue, '_display_endpoint', _('服务器'));
		o.cfgvalue = function(section_id) {
			const host = uci.get('redsocks2', section_id, 'ip') || '';
			const port = uci.get('redsocks2', section_id, 'port') || '';
			return host + (port ? ':' + port : '');
		};

		nodes.tab('basic', _('节点参数'));

		o = nodes.taboption('basic', form.Value, 'name', _('节点名称'));
		o.rmempty = false;
		o.placeholder = _('例如：Romania-02');

		o = nodes.taboption('basic', form.ListValue, 'proxy_type', _('代理协议'));
		Object.keys(PROXY_TYPES).forEach(function(type) {
			o.value(type, PROXY_TYPES[type]);
		});
		o.default = 'https-connect';
		o.rmempty = false;
		o.cfgvalue = function(section_id) {
			return uci.get('redsocks2', section_id, 'proxy_type') || 'https-connect';
		};

		o = nodes.taboption('basic', form.Value, 'ip', _('服务器地址'));
		o.rmempty = false;
		o.placeholder = _('域名或 IPv4 地址');

		o = nodes.taboption('basic', form.Value, 'port', _('端口'));
		o.datatype = 'port';
		o.default = '443';
		o.rmempty = false;

		// Keep ordinary proxy credentials and the Shadowsocks cipher as two
		// independent UCI options and two different widgets.
		o = nodes.taboption('basic', form.Value, 'username', _('普通代理用户名'));
		o.rmempty = true;
		o.depends({ proxy_type: /^(https-connect|http-connect|socks4|socks5)$/ });
		o.write = function(section_id, value) {
			if (value != null && value !== '')
				uci.set('redsocks2', section_id, 'username', value);
			else
				uci.unset('redsocks2', section_id, 'username');
			uci.unset('redsocks2', section_id, 'method');
		};
		o.description = _('仅用于 HTTP/HTTPS CONNECT、SOCKS4 和 SOCKS5 的认证用户名。');

		o = nodes.taboption('basic', form.ListValue, 'method', _('Shadowsocks 加密方法（下拉选择）'));
		[
			'table', 'rc4', 'rc4-md5', 'aes-128-cfb', 'aes-192-cfb',
			'aes-256-cfb', 'bf-cfb', 'camellia-128-cfb', 'camellia-192-cfb',
			'camellia-256-cfb', 'cast5-cfb', 'des-cfb', 'idea-cfb',
			'rc2-cfb', 'seed-cfb'
		].forEach(function(cipher) {
			o.value(cipher, cipher);
		});
		o.default = 'aes-256-cfb';
		o.rmempty = false;
		o.depends({ proxy_type: 'shadowsocks' });
		o.cfgvalue = function(section_id) {
			return uci.get('redsocks2', section_id, 'method') ||
				uci.get('redsocks2', section_id, 'username') || 'aes-256-cfb';
		};
		o.write = function(section_id, value) {
			uci.set('redsocks2', section_id, 'method', value);
			uci.unset('redsocks2', section_id, 'username');
		};
		o.description = _('Shadowsocks 专用加密方法。此处为固定选项列表，不接受手动输入。');

		o = nodes.taboption('basic', form.Value, 'password', _('密码'));
		o.password = true;
		o.rmempty = true;

		const whitelist = m.section(form.TypedSection, 'redsocks2_iptables', _('国内地址直连'));
		whitelist.anonymous = true;
		whitelist.addremove = false;

		o = whitelist.option(form.Flag, 'whitelist_enabled', _('启用国内 IPv4 网段直连'));
		o.default = '1';
		o.rmempty = false;
		o.description = _('自动下载并每周更新中国大陆 IPv4 网段列表。');

		nodes.footer = function() {
			return E('tr', {}, E('td', { 'colspan': 100 }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': ui.createHandlerFn(this, 'showImportModal')
				}, [ _('导入分享链接') ])
			]));
		}.bind(this);

		return m.render();
	},

	handleSave: function(ev) {
		return this.super('handleSave', [ ev ])
			.then(function() {
				return fs.exec('/sbin/uci', [ 'commit', 'redsocks2' ]);
			})
			.then(function(result) {
				if (result.code !== 0)
					throw new Error(result.stderr || result.stdout || _('保存 Redsocks2 配置失败'));
				return fs.exec('/etc/init.d/redsocks2', [ 'restart' ]);
			})
			.then(function(result) {
				if (result.code !== 0)
					throw new Error(result.stderr || result.stdout || _('代理服务重启失败'));
				ui.addNotification(null, E('p', _('配置已保存，代理服务已重启。')), 'info');
				window.setTimeout(function() {
					window.location.reload();
				}, 600);
			});
	},

	handleSaveApply: function(ev) {
		return this.handleSave(ev);
	},

	showImportModal: function() {
		const fileInput = E('input', {
			'type': 'file',
			'accept': '.txt,text/plain',
			'class': 'cbi-input-file',
			'style': 'width:100%; margin:8px 0;'
		});
		const protocol = E('select', { 'class': 'cbi-input-select', 'style': 'width:100%;' }, [
			E('option', { 'value': 'auto' }, _('自动检测（推荐）')),
			E('option', { 'value': 'socks5' }, _('SOCKS5')),
			E('option', { 'value': 'http-connect' }, _('HTTP CONNECT')),
			E('option', { 'value': 'https-connect' }, _('HTTPS CONNECT')),
			E('option', { 'value': 'socks4' }, _('SOCKS4'))
		]);
		const textarea = E('textarea', {
			'class': 'cbi-input-textarea',
			'rows': '6',
			'style': 'width:100%; min-height:120px;',
			'placeholder': 'https://MTkzLjE3Ni44NC4zNzo5MDAy?allowInsecure=1#Romania-02'
		});

		ui.showModal(_('导入代理节点'), [
			E('p', {}, _('上传 TXT 文件，或直接粘贴节点内容。支持每行一个 IP:端口，也支持原有代理分享链接。')),
			E('label', {}, _('选择 TXT 文件')),
			fileInput,
			E('label', {}, _('代理协议（纯 IP:端口建议选择自动检测）')),
			protocol,
			E('p', {}, _('纯 IP:端口使用并发协议握手识别 HTTPS CONNECT、HTTP CONNECT、SOCKS5、SOCKS4，不依赖访问 Google；分享链接直接按协议头识别，不进行探测。需要认证的代理可能无法在无凭据时完成识别。')),
			textarea,
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, [ _('取消') ]),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-positive important',
					'click': ui.createHandlerFn(this, 'importLinks', textarea, fileInput, protocol)
				}, [ _('导入节点') ])
			])
		], 'cbi-modal');
		textarea.focus();
	},

	importLinks: function(textarea, fileInput, protocol) {
		const file = fileInput.files && fileInput.files[0];
		const readFile = file ? new Promise(function(resolve, reject) {
			const reader = new FileReader();
			reader.onload = function() { resolve(String(reader.result || '')); };
			reader.onerror = function() { reject(new Error(_('读取 TXT 文件失败'))); };
			reader.readAsText(file);
		}) : Promise.resolve(textarea.value);
		return readFile.then(function(raw) {
			const content = raw.trim();
			if (!content)
				throw new Error(_('请先选择 TXT 文件或粘贴节点内容。'));
			return fs.write('/tmp/redsocks2-import.txt', content, 384);
		}).then(function() {
			return fs.exec('/usr/bin/redsocks2-subscription', [
				'--file', '/tmp/redsocks2-import.txt', '--type', protocol.value
			]);
		}).then(function(result) {
			if (result.code !== 0)
				throw new Error(result.stderr || result.stdout || _('没有可导入的有效节点'));
			ui.hideModal();
			ui.addNotification(null, E('p', result.stdout || _('节点导入成功。')), 'success');
			window.setTimeout(function() {
				window.location.reload();
			}, 800);
		}).catch(function(err) {
			ui.addNotification(null, E('p', String(err)), 'error');
		});
	}
});
