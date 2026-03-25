# Quirk Circuit Companion

A Google Chrome Extension to complement the [Quirk](https://algassert.com/quirk) quantum simulator, making it easier to manage custom components (gates) and copy/paste entire circuits.

## Features

- **Side Panel**: Accessible and elegant interface always available alongside your Quirk circuit. It dynamically updates when you switch tabs between different Quirk files.
- **Gate Management**: 
  - View all custom components (gates) you have created (such as "Oracle", "ISM" operators, etc.).
  - **Copy** the JSON code of an individual gate with a single click `[Copy]`.
  - **Extract Sub-Circuit**: Extract the internal gates/columns that make up a custom gate by clicking `[Copy Circ]`.
  - **Edit/Update**: Edit a gate's raw JSON directly, or paste a copied gate from another tab to flawlessly update a gate here, **preserving its internal ID** so the circuit does not break! `[Edit]`.
  - **Rename**: Easily change the display name of any custom gate by clicking `[Rename]`.
  - **Delete**: Remove a gate from your circuit instantly using `[Delete]`.
  - Add a new gate copied from another Quirk window by pasting its JSON code.
- **Circuit Management**:
  - Copy the entire circuit (including its gates) to the clipboard.
  - Convert your **entire current circuit into a custom gate** with one click using `[Copy Circuit as Gate]`.
  - Paste (append) an entire circuit to the end of your current circuit.
  - **Advanced Pasting Options**: 
    - Shift the pasted circuit vertically by specifying a **Qubit Offset**.
    - **Reverse Time (Columns)**: Append the circuit horizontally backwards (useful for creating anti-compute structures).
    - **Reverse Endian (Top-to-Down)**: Invert the qubits vertically within the pasted bounds.

## Installation

Since the extension is not yet published on the Chrome Web Store, you must install it manually by enabling "Developer mode".

1. Open Google Chrome and go to the extensions page: `chrome://extensions/`.
2. In the top right corner, enable **"Developer mode"**.
3. Click the **"Load unpacked"** button in the top left.
4. Select the directory where you have the code for this extension (`/quirk-extension`).
5. **CRITICAL for local files**: If you use Quirk by opening `.html` files saved on your computer (`file:///...`), find "Quirk Circuit Companion" in your extensions list, click **"Details"**, and enable **"Allow access to file URLs"**.

## Usage

1. Pin the extension icon to your Chrome taskbar by clicking the puzzle piece icon.
2. Open any Quirk page (either online or a local `.html` file).
3. Click the extension icon to open the Side Panel.
4. Inside the panel, you will see your current Gates. You can use the row buttons to **Copy**, **Copy Circ** (its inner structure), **Edit**, **Rename** or **Delete** them.
5. To add a Gate from another Quirk window, click **"Add Gate via JSON"**, paste the code, and click **"Add to Circuit"**. This will update the stage, adding the gate for use.
6. In the *Circuit Operations* section, use **"Copy Complete Circuit"** to save the current circuit.
7. Use **"Copy Circuit as Gate"** if you've built a circuit and want to instantly wrap it into a reusable custom gate (it assigns a random ID and copies it to your clipboard).
8. To combine circuits, open the target circuit, click **"Append Circuit via JSON"**, paste the code of a previously copied circuit, adjust settings (such as reversing time/endianness or setting an offset). Click **"Append"** and the pasted circuit's operations will be added to the end of yours.

## Technologies Used

- Google Chrome Extensions API (Manifest V3)
- HTML5, Vanilla JavaScript, CSS3 (Variables, Flexbox Layout, and "Glassmorphism" design).

## Credits

Created by [antoniomg](http://antonio.mg) with the assistance of Gemini.
