import { App, Plugin, PluginSettingTab, Setting, ColorComponent } from 'obsidian';
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
        const textContent = node.textContent || ''; // Get the text content
        let match;
        let lastIndex = 0;
        const fragments: (string | HTMLElement)[] = [];
    
        // Find all matches of the regex
        while ((match = todoRx.exec(textContent)) !== null) {
          // Push the text before the match
          if (match.index > lastIndex) {
            fragments.push(textContent.slice(lastIndex, match.index));
          }
          // Create a span element for the match and push it
          const span = node.createEl('span', { cls: 'cm-todo', text: match[0] });
          fragments.push(span);
          lastIndex = match.index + match[0].length;
        }
    
        // Push the remaining text after the last match
        if (lastIndex < textContent.length) {
          fragments.push(textContent.slice(lastIndex));
        }
    
        // Clear the node's content and append the fragments
        node.empty();
        fragments.forEach(fragment => {
          if (typeof fragment === 'string') {
            node.createEl('span', { text: fragment });
          } else {
            node.appendChild(fragment);
          }
        });
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

    let picker: ColorComponent | undefined;

    new Setting(containerEl)
      .setName('TODO colour')
      .setDesc('Choose the highlight colour for your TODOs.')
      .addExtraButton(btn =>
        btn
          .setIcon('rotate-ccw')                 
          .setTooltip('Reset to default colour')
          .onClick(async () => {
            const defaultColour = DEFAULT_SETTINGS.todoColor;
            this.plugin.settings.todoColor = defaultColour;
            picker?.setValue(defaultColour);
            await this.plugin.saveSettings();
          })
      )
      .addColorPicker(cp => {
        picker = cp;
        cp.setValue(this.plugin.settings.todoColor)
          .onChange(async value => {
            this.plugin.settings.todoColor = value;
            await this.plugin.saveSettings();
          });
      })
  }
}
