window.addEventListener('message', async (e) => {
  if (e.data?.type === 'updateCode') {
    await window.app.writeFile('app.py', e.data?.code);
    await window.app.writeFile(
      'trigger.py',
      'import run; await run.run(); # ' + Math.random(),
    );
    return;
  }

  if (e.data?.type === 'reportError') {
    parent.postMessage(
      { type: 'reportError', errorText: e.data?.errorText },
      '*',
    ); // IMPORTANT: put actual origin here in production
    return;
  }
});

window.app = stlite.mount(
  {
    requirements: ['requests'],
    entrypoint: 'trigger.py',
    files: {
      'trigger.py': 'import run; await run.run()',
      'app.py': '',
      // NOTE: in production, we probably want to inline these two
      'run.py': { url: 'python/run.py' },
      'util.py': { url: 'python/util.py' },
    },
    streamlitConfig: {
      'client.toolbarMode': 'minimal',
      'server.runOnSave': true,
    },
  },
  document.getElementById('root'),
);
