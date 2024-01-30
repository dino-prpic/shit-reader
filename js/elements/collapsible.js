const template = document.createElement('template');
template.innerHTML = /*html*/`
<style>
    :host {
        display: grid;
        grid-template-rows: auto 0fr;
        grid-template-areas: "header" "content";
        transition: grid-template-rows .2s ease;
        z-index: 10;
        background: #cce3e23b;
        border-radius: 1vmin;
        padding: 1vmin;
    }
    :host(:focus),
    :host(:focus-within),
    :host(:focus-visible),
    :host(:checked) {
        grid-template-rows: auto 1fr;
    }

    #content {
        overflow: hidden;
        grid-area: content;
    }

</style>
<div id="header">
    <!-- <input type="checkbox" name="show" id="show"> -->
    <span id="title"></span>
</div>
<div id="content">
    <slot></slot>
</div>

`;

class Collapsible extends HTMLElement {
    constructor() {
        super();
        this.tabIndex = 0;
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    connectedCallback() {
        this.shadowRoot.querySelector('#title').innerText = this.getAttribute('title');
    }

}

customElements.define('collapsible-element', Collapsible);