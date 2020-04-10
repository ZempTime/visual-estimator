import { LitElement, html, css } from 'lit-element';

import { Network } from 'https://unpkg.com/vis-network?module';
import { fetchNodes } from './api';

export class VisualEstimator extends LitElement {
  static get properties() {
    return {
      page: { type: String },
    };
  }

  firstUpdated() {
    this.applyNetwork();
  }

  static get styles() {
    return css`
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        font-size: calc(10px + 2vmin);
        color: #1a2b42;
        max-width: 960px;
        margin: 0 auto;
        text-align: center;
      }

      main {
        flex-grow: 1;
      }
    `;
  }

  async applyNetwork() {
    const rawNodes = await fetchNodes();

    const nodes = rawNodes.map(node => ({
      id: node.id,
      label: node.name,
      level: { objective: 1 }[node.type],
    }));

    // create an array with edges
    const edges = [];

    // create a network
    const container = this.shadowRoot.querySelector('#network');
    const data = {
      nodes,
      edges,
    };
    const options = {
      layout: {
        hierarchical: true,
      },
    };
    const network = new Network(container, data, options);
  }

  render() {
    return html`
      <main>
        <div id="network"></div>
      </main>
    `;
  }
}
