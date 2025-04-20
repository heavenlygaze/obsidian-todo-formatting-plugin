import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
// CodeMirror 6 view API:
import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet
} from '@codemirror/view';

// CodeMirror 6 state API:
import { RangeSetBuilder } from '@codemirror/state';

interface TodoHighlightSettings {
  todoColor: string;
}

const DEFAULT_SETTINGS: TodoHighlightSettings = {
  todoColor: '#00FF00'
};

export default class TodoHighlightPlugin extends Plugin {
  settings: TodoHighlightSettings;

  async onload() {
    await this.loadSettings();

    // Inject CSS based on current setting
    this.injectTodoStyle();

    // Add our settings tab
    this.addSettingTab(new TodoHighlightSettingTab(this.app, this));

    // Preview/highlight in read mode
    this.registerMarkdownPostProcessor((el) => {
      const todoRx = /\bTODO\b/g;
      el.querySelectorAll('p, li').forEach((node: HTMLElement) => {
        node.innerHTML = node.innerHTML.replace(
          todoRx,
          `<span class="cm-todo">$&</span>`
        );
      });
    });

    // Highlight in edit mode 
    const todoEditorDecorator = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
          this.decorations = this.buildDeco(view);
        }
        update(update: ViewUpdate) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDeco(update.view);
          }
        }
        buildDeco(view: EditorView) {
          const builder = new RangeSetBuilder<Decoration>();
          const regex = /\bTODO\b/g;
          for (const { from, to } of view.visibleRanges) {
            const text = view.state.doc.sliceString(from, to);
            let m;
            while ((m = regex.exec(text)) !== null) {
              const start = from + m.index;
              const end = start + m[0].length;
              builder.add(start, end, Decoration.mark({ class: 'cm-todo' }));
            }
          }
          return builder.finish();
        }
      },
      { decorations: v => v.decorations }
    );
    this.registerEditorExtension([todoEditorDecorator]);
  }

  onunload() {
    this.removeTodoStyle();
  }

  // Load + save
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.injectTodoStyle();
  }

  // Inject <style id="todo-highlight-style"> into document head
  injectTodoStyle() {
    const styleId = 'todo-highlight-style';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `
      .cm-todo {
        color: ${this.settings.todoColor} !important;
      }
      /* also apply to preview spans just in case */
      span.cm-todo {
        color: ${this.settings.todoColor};
      }
    `;
  }
  removeTodoStyle() {
    document.getElementById('todo-highlight-style')?.remove();
  }
}

// Settings tab to pick a colour
class TodoHighlightSettingTab extends PluginSettingTab {
  plugin: TodoHighlightPlugin;
  constructor(app: App, plugin: TodoHighlightPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'TODO Highlighter Settings' });

    new Setting(containerEl)
      .setName('TODO color')
      .setDesc('Choose the highlight colour for your TODOs.')
      .addColorPicker(colorPicker =>
        colorPicker
          .setValue(this.plugin.settings.todoColor)
          .onChange(async (value) => {
            this.plugin.settings.todoColor = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
