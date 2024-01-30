const template = document.createElement('template');
template.innerHTML = /*html*/`
<style>
    :host {
        overflow-x: hidden;
        overflow-y: auto;
        display: flex;
        flex-wrap: wrap;
        box-sizing: border-box;
        justify-content: center;
        padding: 1vmin;
        gap: 1vmin;
        flex: 1;
        background: #cce3e2;
        border-radius: 1vmin;
    }
    ::slotted(.page) {
        max-height: 90%;
        max-width: 100%;
        opacity: 0.8;
    }
    ::slotted(.page.active) {
        opacity: 1;
        box-shadow: 0 0 10px 5px rgba(0,0,0,0.1);
    }
</style>
<slot></slot>
`;

class PageManager extends HTMLElement {
    #currPage = 0;
    #slot;
    #pages;
    constructor() {
        super();
        this.tabIndex = 0;
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.#slot = this.shadowRoot.querySelector('slot');
        this.#slot.addEventListener('slotchange', () => {
            this.#pages = this.shadowRoot.querySelector('slot').assignedElements();
            this.#pages.forEach((page, i) => {
                page.classList.add('page');
                page.onclick = () => this.select(i);
            });
            this.select(0, true);
        });
    }
    empty() {
        this.innerHTML = '';
    }

    select(i, discrete = false) {
        if (i < 0 || i >= this.#pages.length) return;
        this.#currPage = i;

        this.#pages.forEach(page => page.classList.remove('active'));
        this.#pages[this.#currPage].classList.add('active');
        this.#pages[this.#currPage].scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (discrete) return;
        const event = new CustomEvent('selectedPage', { detail: i + 1 });
        document.dispatchEvent(event);
    }
    next() {
        this.select(this.#currPage+1);
    }
    previous() {
        this.select(this.#currPage-1);
    }

    get currPage() {
        return this.#currPage;
    }

}

customElements.define('shit-page-manager', PageManager);