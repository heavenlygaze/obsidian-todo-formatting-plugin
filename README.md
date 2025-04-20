# TODO Highlighter

Obsidian plugin that highlights all occurrences of `TODO` in your notes with a user‑selected colour.

## Features

- Detects the exact word `TODO` in both edit and preview modes.
- Live updates when you change the colour in Settings


## Usage

Once enabled, the plugin will automatically highlight every occurrence of `TODO`:

- **Preview Mode:** Wrapped in a `<span class="cm-todo">` (colour set via Settings).
- **Edit Mode:** Highlighted using a CodeMirror decoration.

## Settings

Navigate to **Settings → Plugin Options → TODO Highlighter** to configure:

| Option        | Description                                    | Default    |
| ------------- | ---------------------------------------------- | ---------- |
| **TODO Color**    | Hex code for your `TODO` tags.  | `#00FF00`  |


## Maintenance & Contributions

If you have any feedback, please feel free to open an issue or pull request. All contributions are welcome.

# Development

Clone the repository, run `npm install` to install the dependencies. `npm run dev` to run it (Make sure that you have your cloned repository placed under `.obsidian/plugins` directory of your vault).