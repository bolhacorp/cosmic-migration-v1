# Cosmic v1 to v2 Formatter

This utility formats and converts export files from Cosmic v1 to the new Cosmic v2 structure.

## Usage

1. **Install dependencies** (if any):
   ```sh
   npm install
   ```

2. **Run the script using npm:**
   ```sh
   npm start -- -n <export-file-name>
   ```
   Replace `<export-file-name>` with the desired object type (e.g., `informacoes-estaticas-amaissp`).

3. **Output:**
   The script will process the data and generate a formatted file compatible with Cosmic v2.

## Files
- `index.js`: Main entry point.

## Notes
- Make sure your input files are in the correct format as exported from Cosmic v1.
- The output file will be saved in the project directory.

---

**Example:**
```sh
npm start -- -n informacoes-estaticas-amaissp
```
