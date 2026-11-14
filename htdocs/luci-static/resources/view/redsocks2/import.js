'use strict';
'require view';
'require ui';
'require fs';

return view.extend({
	render: function() {
		var status = E('p', { 'class': 'cbi-section-descr' },
			_('尚未导入。TXT 中的纯 IP:端口将自动识别协议；分享链接按协议头直接识别。'));
		var button;
		button = E('button', {
			'class': 'cbi-button cbi-button-action important',
			'click': function(ev) {
				ev.preventDefault();
				button.disabled = true;
				status.textContent = _('请选择 TXT 文件并上传…');
				ui.uploadFile('/tmp/redsocks2-import.txt', null,
					_('仅上传 TXT 节点列表；纯 IP:端口自动识别协议。')).then(function(upload) {
					if (!upload || upload.size < 1 || upload.size > 1048576)
						throw new Error(_('文件为空或超过 1 MB'));
					status.textContent = _('文件已上传，正在自动识别协议并导入节点…');
					return fs.exec('/usr/bin/redsocks2-subscription', [
						'--file', '/tmp/redsocks2-import.txt', '--type', 'auto'
					]);
				}).then(function(result) {
					if (result.code !== 0)
						throw new Error((result.stderr || result.stdout || _('导入失败')).trim());
					status.textContent = (result.stdout || _('导入完成')).trim();
				}).catch(function(err) {
					status.textContent = _('导入失败：%s').format(err.message || err);
				}).finally(function() {
					button.disabled = false;
				});
			}
		}, _('选择 TXT 文件并自动识别导入'));
		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Redsocks2 - 批量导入节点')),
			E('p', { 'class': 'cbi-section-descr' },
				_('上传 TXT 文本。纯 IP:端口自动检测 HTTPS CONNECT、HTTP CONNECT、SOCKS5、SOCKS4；分享链接直接按协议头识别。')),
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('div', { 'class': 'cbi-value-field' }, [ button ])
				]),
				status
			])
		]);
	}
});
