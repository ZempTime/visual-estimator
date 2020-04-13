import { LitElement, html, css } from 'lit-element';
import { Router } from '@vaadin/router';

import './pages/index.js';

export class VisualEstimator extends LitElement {
  static get properties() {
    return {};
  }

  firstUpdated() {
    super.firstUpdated();
    this.router = new Router(this.shadowRoot.getElementById('outlet'));
    this.router.setRoutes([
      { path: '/', component: 'overview-page' },
      {
        path: '/objectives/:id',
        component: 'objective-page',
      },
    ]);
  }

  static get styles() {
    return css`
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-start;
        font-size: calc(10px + 2vmin);
        color: #1a2b42;
        max-width: 960px;
        margin: 0 auto;
        text-align: center;
      }
    `;
  }

  render() {
    return html`
      <main id="outlet"></main>
    `;
  }
}
