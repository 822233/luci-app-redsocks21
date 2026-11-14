'use strict';
'require view';
'require ui';
'require fs';

return view.extend({
	render: function() {
		var status = E('p', { 'class': 'cbi-section-descr' }, _('尚未导入。'));
		var textarea = E('textarea', {
			'class': 'cbi-input-textarea',
			'rows': '10',
			'style': 'width:100%; min-height:180px;',
			'placeholder': _('粘贴代理分享链接或 IP:端口，每行一个；也可以上传 TXT 文件。')
		});
		var fileButton = E('button', {
			'class': 'cbi-button',
			'click': function(ev) {
				ev.preventDefault();
				fileButton.disabled = true;
				status.textContent = _('请选择 TXT 文件并上传…');
				ui.uploadFile('/tmp/redsocks2-import.txt', null,
					_('TXT 文件最大 1 MB；纯 IP:端口自动识别协议。')).then(function(upload) {
					if (!upload || upload.size < 1 || upload.size > 1048576)
						throw new Error(_('文件为空或超过 1 MB'));
					return importFile();
				}).catch(showError).finally(function() {
					fileButton.disabled = false;
				});
			}
		}, _('选择 TXT 文件并自动识别导入'));

		function showError(err) {
			status.textContent = _('导入失败：%s').format(err.message || err);
		}

		function importFile() {
			status.textContent = _('正在自动识别协议并导入节点…');
			return fs.exec('/usr/bin/redsocks2-subscription', [
				'--file', '/tmp/redsocks2-import.txt', '--type', 'auto'
			]).then(function(result) {
				if (result.code !== 0)
					throw new Error((result.stderr || result.stdout || _('导入失败')).trim());
				status.textContent = (result.stdout || _('导入完成')).trim();
			});
		}

		var pasteButton = E('button', {
			'class': 'cbi-button cbi-button-action important',
			'click': function(ev) {
				ev.preventDefault();
				var content = textarea.value.trim();
				if (!content) {
					status.textContent = _('请先粘贴节点内容。');
					return;
				}
				if (content.length > 1048576) {
					status.textContent = _('内容超过 1 MB，请拆分后导入。');
					return;
				}
				pasteButton.disabled = true;
				fs.write('/tmp/redsocks2-import.txt', content, 384).then(importFile)
					.catch(showError).finally(function() {
						pasteButton.disabled = false;
					});
			}
		}, _('粘贴内容并自动识别导入'));

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Redsocks2 - 批量导入节点')),
			E('p', { 'class': 'cbi-section-descr' },
				_('分享链接按协议头直接识别；纯 IP:端口自动检测 HTTPS CONNECT、HTTP CONNECT、SOCKS5、SOCKS4。无需手动选择协议。')),
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('div', { 'class': 'cbi-value-field' }, [ fileButton ])
				]),
				E('p', {}, _('也可以直接粘贴节点列表：')),
				textarea,
				E('div', { 'class': 'cbi-value' }, [
					E('div', { 'class': 'cbi-value-field' }, [ pasteButton ])
				]),
				status
			])
		]);
	}
});
