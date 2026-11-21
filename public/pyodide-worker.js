/* global importScripts, loadPyodide */
let pyodideReady = null;

async function ensurePyodide() {
  if (!pyodideReady) {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
    pyodideReady = loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    });
  }
  return pyodideReady;
}

self.onmessage = async (event) => {
  const { id, type, code, input } = event.data;

  if (type === 'warmup') {
    try {
      await ensurePyodide();
      self.postMessage({ id, ok: true });
    } catch (err) {
      self.postMessage({ id, ok: false, error: err?.message || String(err) });
    }
    return;
  }

  if (type === 'run') {
    try {
      const pyodide = await ensurePyodide();
      const start = performance.now();

      pyodide.globals.set('__usaco_code__', String(code ?? ''));
      pyodide.globals.set('__usaco_stdin__', String(input ?? ''));

      const resultJson = await pyodide.runPythonAsync(`
import io, sys, json, traceback

_orig_in, _orig_out, _orig_err = sys.stdin, sys.stdout, sys.stderr
_out = io.StringIO()
_err = io.StringIO()
sys.stdin = io.StringIO(__usaco_stdin__)
sys.stdout = _out
sys.stderr = _err

_status = "OK"
try:
    _ns = {"__name__": "__main__"}
    exec(compile(__usaco_code__, "solution.py", "exec"), _ns)
except SystemExit as _se:
    if _se.code not in (None, 0):
        _status = "RE"
        _err.write(f"SystemExit: {_se.code}\\n")
except SyntaxError:
    _status = "CE"
    traceback.print_exc(file=_err)
except Exception:
    _status = "RE"
    traceback.print_exc(file=_err)
finally:
    sys.stdin, sys.stdout, sys.stderr = _orig_in, _orig_out, _orig_err

json.dumps({
    "status": _status,
    "stdout": _out.getvalue(),
    "stderr": _err.getvalue(),
})
`);

      const elapsedMs = Math.round(performance.now() - start);
      const parsed = JSON.parse(resultJson);
      self.postMessage({
        id,
        ok: true,
        status: parsed.status,
        stdout: parsed.stdout,
        stderr: parsed.stderr,
        elapsedMs,
      });
    } catch (err) {
      self.postMessage({
        id,
        ok: false,
        status: 'RE',
        stdout: '',
        stderr: err?.message || String(err),
        elapsedMs: 0,
      });
    }
  }
};
