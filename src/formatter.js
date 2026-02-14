export class Formatter {
  constructor() {
    this.container = document.getElementById('formatter');
  }

  init() {
    this.container.innerHTML = `
      <h2 class="panel-title">Formatting Assistant</h2>
      <p>Paste your lore text below and click Convert.</p>
      <textarea id="formatInput" class="formatter-area" placeholder="Add your lore draft..."></textarea>
      <button id="convertBtn" type="button">Convert</button>
      <textarea id="markdownOutput" class="formatter-area" readonly></textarea>
      <button id="copyMarkdownBtn" type="button">Copy Markdown</button>
      <div class="instructions">
        <p>Copy the markdown and submit a pull request on GitHub to add new lore.</p>
      </div>
    `;
    document.getElementById('convertBtn').addEventListener('click', () => this.convert());
    document.getElementById('copyMarkdownBtn').addEventListener('click', async () => {
      const out = document.getElementById('markdownOutput');
      await navigator.clipboard.writeText(out.value);
    });
  }

  convert() {
    const text = document.getElementById('formatInput').value;
    const title = text.split('\n')[0].replace(/^#+\s*/, '').trim() || 'New Lore Entry';
    const body = text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean)
      .join('\n\n');
    const md = `# ${title}\n\n${body}`;
    document.getElementById('markdownOutput').value = md;
  }
}
