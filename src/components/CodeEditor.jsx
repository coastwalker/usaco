import React, { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { indentWithTab } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';
import { ChevronDown, Play, RotateCcw, Send, Type } from 'lucide-react';

const LANGUAGE_OPTIONS = [
  { id: 'python', label: 'Python 3', version: '3.12' },
  { id: 'cpp', label: 'C++17', version: 'g++ -O2' },
  { id: 'java', label: 'Java 21', version: 'OpenJDK' },
];

function getLanguageExtension(lang) {
  if (lang === 'cpp') return cpp();
  if (lang === 'java') return java();
  return python();
}

const lightEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  '.cm-gutters': {
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    borderRight: '1px solid #e2e7ef',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#eef2f7',
    color: '#334155',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(29, 78, 216, 0.045)',
  },
  '.cm-cursor': {
    borderLeftColor: '#1d4ed8',
  },
});

const darkEditorTheme = [
  oneDark,
  EditorView.theme(
    {
      '&': {
        backgroundColor: '#121821',
        color: '#e6edf5',
      },
      '.cm-gutters': {
        backgroundColor: '#0e131b',
        color: '#64748b',
        borderRight: '1px solid #222c3c',
      },
      '.cm-activeLineGutter': {
        backgroundColor: '#1a2230',
        color: '#cbd5e1',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
      },
      '.cm-cursor': {
        borderLeftColor: '#60a5fa',
      },
    },
    { dark: true }
  ),
];

export default function CodeEditor({
  language,
  onLanguageChange,
  code,
  onCodeChange,
  onResetCode,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  theme,
  fontSize,
  onFontSizeChange,
  testCount,
}) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);
  const langCompartment = useRef(new Compartment());
  const themeCompartment = useRef(new Compartment());
  const fontCompartment = useRef(new Compartment());
  const callbacksRef = useRef({ onCodeChange, onRun, onSubmit });

  callbacksRef.current = { onCodeChange, onRun, onSubmit };

  useEffect(() => {
    if (!hostRef.current) return undefined;

    const runShortcut = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          callbacksRef.current.onRun();
          return true;
        },
      },
      {
        key: 'Mod-Shift-Enter',
        run: () => {
          callbacksRef.current.onSubmit();
          return true;
        },
      },
      indentWithTab,
    ]);

    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        indentUnit.of('    '),
        runShortcut,
        langCompartment.current.of(getLanguageExtension(language)),
        themeCompartment.current.of(theme === 'dark' ? darkEditorTheme : lightEditorTheme),
        fontCompartment.current.of(
          EditorView.theme({
            '&': { fontSize: `${fontSize}px` },
          })
        ),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            callbacksRef.current.onCodeChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: hostRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Keep external code updates (problem switch, language switch, reset, load submission) synced
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== code) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: code },
      });
    }
  }, [code]);

  // Update language syntax highlighting dynamically
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: langCompartment.current.reconfigure(getLanguageExtension(language)),
    });
  }, [language]);

  // Update light/dark theme dynamically
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeCompartment.current.reconfigure(
        theme === 'dark' ? darkEditorTheme : lightEditorTheme
      ),
    });
  }, [theme]);

  // Update font size dynamically
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: fontCompartment.current.reconfigure(
        EditorView.theme({
          '&': { fontSize: `${fontSize}px` },
        })
      ),
    });
  }, [fontSize]);

  const busy = isRunning || isSubmitting;

  return (
    <section className="pane editor-pane">
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <div className="problem-select-wrap">
            <select
              id="language-selector"
              aria-label="Select programming language"
              className="lang-select"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} ({opt.version})
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="problem-select-chevron" />
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Auto-saved locally
          </span>
        </div>

        <div className="editor-toolbar-right">
          <div className="problem-select-wrap" title="Editor font size">
            <Type size={13} style={{ color: 'var(--text-muted)', marginRight: 2 }} />
            <select
              aria-label="Editor font size"
              className="lang-select"
              style={{ paddingRight: 24 }}
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
            >
              {[12, 13, 14, 15, 16, 18].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}px
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="problem-select-chevron" />
          </div>

          <button
            id="reset-code-btn"
            type="button"
            className="icon-btn bordered"
            onClick={onResetCode}
            title="Reset editor to starter template"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div ref={hostRef} className="editor-mount" />

      <div className="editor-footer">
        <div className="editor-status-hint">
          <span>
            {language === 'java'
              ? 'Use public class Main (stdin / stdout)'
              : 'Read from stdin · Write to stdout'}
          </span>
        </div>

        <div className="editor-actions">
          <button
            id="run-code-btn"
            type="button"
            className="btn btn-secondary"
            onClick={onRun}
            disabled={busy}
            title="Run against current testcase (Ctrl/Cmd + Enter)"
          >
            {isRunning ? <span className="spinner" /> : <Play size={14} />}
            <span>{isRunning ? 'Running…' : 'Run'}</span>
            <span className="kbd-hint">⌘↵</span>
          </button>

          <button
            id="submit-code-btn"
            type="button"
            className="btn btn-submit"
            onClick={onSubmit}
            disabled={busy}
            title="Submit against all official USACO test cases (Ctrl/Cmd + Shift + Enter)"
          >
            {isSubmitting ? <span className="spinner" /> : <Send size={14} />}
            <span>
              {isSubmitting
                ? 'Judging…'
                : `Submit (${testCount || 11} Tests)`}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
