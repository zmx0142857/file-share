const indexHtml = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>文件分享</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f2f5; color: #333; padding: 24px; }
    .container { max-width: 720px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 24px; font-size: 28px; color: #1a1a2e; }
    .upload-area { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .upload-area input[type="file"] { display: none; }
    .drop-zone { border: 2px dashed #c0c4cc; border-radius: 8px; padding: 32px; text-align: center; cursor: pointer; transition: border-color .2s, background .2s; }
    .drop-zone:hover, .drop-zone.dragover { border-color: #409eff; background: #ecf5ff; }
    .drop-zone p { color: #909399; font-size: 14px; margin-top: 8px; }
    .drop-zone .icon { font-size: 40px; color: #c0c4cc; }
    .file-names { margin-top: 12px; font-size: 13px; color: #606266; max-height: 80px; overflow-y: auto; }
    .btn-row { margin-top: 16px; text-align: right; }
    .btn { padding: 8px 24px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; transition: background .2s; }
    .btn-primary { background: #409eff; color: #fff; }
    .btn-primary:hover { background: #66b1ff; }
    .btn-primary:disabled { background: #a0cfff; cursor: not-allowed; }
    .msg { margin-top: 12px; font-size: 13px; padding: 8px 12px; border-radius: 4px; display: none; }
    .msg.success { display: block; background: #f0f9eb; color: #67c23a; }
    .msg.error { display: block; background: #fef0f0; color: #f56c6c; }
    .file-list { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .file-list h2 { font-size: 18px; margin-bottom: 16px; color: #1a1a2e; }
    .file-list ul { list-style: none; }
    .file-list li { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    .file-list li:last-child { border-bottom: none; }
    .file-list li .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-list li .size { color: #909399; font-size: 12px; margin-left: 12px; white-space: nowrap; }
    .file-list li a { color: #409eff; text-decoration: none; font-size: 13px; margin-left: 12px; white-space: nowrap; }
    .file-list li a:hover { text-decoration: underline; }
    .empty { text-align: center; color: #c0c4cc; padding: 24px 0; font-size: 14px; }
  </style>
</head>
<body>
<div class="container">
  <h1>📁 文件分享</h1>
  <div class="upload-area">
    <input type="file" id="fileInput" multiple />
    <div class="drop-zone" id="dropZone">
      <div class="icon">⬆️</div>
      <p>点击或拖拽文件到此处上传</p>
    </div>
    <div class="file-names" id="fileNames"></div>
    <div class="btn-row">
      <button class="btn btn-primary" id="uploadBtn" disabled>上传</button>
    </div>
    <div class="msg" id="msg"></div>
  </div>
  <div class="file-list">
    <h2>📂 已分享文件</h2>
    <ul id="fileList"></ul>
  </div>
</div>
<script>
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const fileNames = document.getElementById('fileNames');
  const uploadBtn = document.getElementById('uploadBtn');
  const msgEl = document.getElementById('msg');
  const fileList = document.getElementById('fileList');

  // 点击选择文件
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    showSelectedFiles();
    uploadBtn.disabled = fileInput.files.length === 0;
  });

  // 拖拽
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    fileInput.files = e.dataTransfer.files;
    showSelectedFiles();
    uploadBtn.disabled = fileInput.files.length === 0;
  });

  function showSelectedFiles() {
    const names = Array.from(fileInput.files).map(f => f.name).join('、');
    fileNames.textContent = names;
  }

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className = 'msg ' + type;
  }

  // 上传
  uploadBtn.addEventListener('click', async () => {
    if (fileInput.files.length === 0) return;
    uploadBtn.disabled = true;
    uploadBtn.textContent = '上传中…';
    const formData = new FormData();
    Array.from(fileInput.files).forEach(f => formData.append('files', f));
    try {
      const resp = await fetch('/upload', { method: 'POST', body: formData });
      const result = await resp.json();
      if (result.code === 200) {
        showMsg('上传成功！', 'success');
        fileInput.value = '';
        fileNames.textContent = '';
        loadFileList();
      } else {
        showMsg(result.msg || '上传失败', 'error');
      }
    } catch (err) {
      showMsg('网络错误：' + err.message, 'error');
    } finally {
      uploadBtn.textContent = '上传';
      uploadBtn.disabled = fileInput.files.length === 0;
    }
  });

  // 格式化文件大小
  function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + units[i];
  }

  // 加载文件列表
  async function loadFileList() {
    try {
      const resp = await fetch('/list');
      const result = await resp.json();
      if (result.code === 200 && result.data.length > 0) {
        fileList.innerHTML = result.data.map(f =>
          '<li>' +
            '<span class="name" title="' + f.name + '">' + f.name + '</span>' +
            '<span class="size">' + formatSize(f.size) + '</span>' +
            '<a href="/files/' + encodeURIComponent(f.name) + '" target="_blank">下载</a>' +
          '</li>'
        ).join('');
      } else {
        fileList.innerHTML = '<div class="empty">暂无文件</div>';
      }
    } catch {
      fileList.innerHTML = '<div class="empty">加载失败</div>';
    }
  }

  loadFileList();
</script>
</body>
</html>
`
export default indexHtml