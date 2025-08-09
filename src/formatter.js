export class Formatter {
  constructor() {
    this.container = document.getElementById('formatter');
  }

  init() {
    this.container.innerHTML = `
      <h2 style="color:#FF9E42;">Formatting Assistant</h2>
      <p>Paste your lore text below and click Convert.</p>
      <textarea id="formatInput" style="width:100%;height:30vh;"></textarea>
      <button id="convertBtn" type="button">Convert</button>
      <textarea id="markdownOutput" style="width:100%;height:30vh;" readonly></textarea>
      <button id="copyMarkdownBtn" type="button">Copy Markdown</button>
      <div class="instructions" style="font-size:1vw;">
        <p>Copy the markdown and submit a pull request on GitHub to add new lore.</p>
      </div>
    `;
    document.getElementById('convertBtn').addEventListener('click', () => this.convert());
    document.getElementById('copyMarkdownBtn').addEventListener('click', () => {
      const out = document.getElementById('markdownOutput');
      out.select();
      document.execCommand('copy');
    });
  }

  convert() {
    const text = document.getElementById('formatInput').value;
    const md = text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p)
      .map(p => p)
      .join('\n\n');
    document.getElementById('markdownOutput').value = md;
  }
}
