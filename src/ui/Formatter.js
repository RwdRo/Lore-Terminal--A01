// Formatter.js - formatting view
import { formatText, withFrontMatter } from '../formatter.js';

export class FormatterView {
    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'view formatter-view';
        this.el.innerHTML = `
            <div class="formatter-split">
                <textarea class="fmt-input"></textarea>
                <pre class="fmt-preview"></pre>
            </div>
            <button class="copy-btn">Copy Markdown</button>
        `;
    }

    init() {
        if (this.initialized) return;
        this.input = this.el.querySelector('.fmt-input');
        this.preview = this.el.querySelector('.fmt-preview');
        this.copyBtn = this.el.querySelector('.copy-btn');

        const update = () => {
            const md = formatText(this.input.value);
            this.current = md;
            this.preview.textContent = md;
        };
        this.input.addEventListener('input', update);
        update();

        this.copyBtn.addEventListener('click', () => {
            const full = withFrontMatter(this.current || '');
            navigator.clipboard.writeText(full);
        });
        this.initialized = true;
    }
}
