import { LitElement, html, css } from 'lit-element';

import { Network } from 'https://unpkg.com/vis-network?module';
import { fetchNodes } from './api';

export class VisualEstimator extends LitElement {
  static get properties() {
    return {
      network: { type: Object },
      nodes: { type: Array },
      edges: { type: Array },
      q: { type: String },
    };
  }

  constructor() {
    super();
    this.nodes = [];
    this.edges = [];
    this.q = '';
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

      #network {
        width: 100%;
      }

      .table,
      th,
      td {
        border-collapse: collapse;
        text-align: left;
      }

      th,
      td {
        padding: 15px;
      }

      .filter {
        width: 100%;
        padding: 12px 20px;
        margin: 8px 0;
        box-sizing: border-box;
        font-size: 16px;
      }

      .clickable {
        cursor: pointer;
      }
      .clickable:hover {
        background-color: #f3f3f3;
      }
    `;
  }

  get filteredNodes() {
    if (this.q === '') return this.nodes;
    return this.nodes.filter(n => n.name.toLowerCase().includes(this.q.toLowerCase()));
  }

  handleFilter(e) {
    this.q = e.target.value;
  }

  handleFocusNode(e) {
    const focusedTr = e.composedPath().find(el => el.hasAttribute && el.hasAttribute('focusable'));
    const nodeId = parseInt(focusedTr.dataset.nodeId, 10);
    this.network.focus(nodeId);
  }

  async applyNetwork() {
    const { rawNodes, rawEdges } = await fetchNodes();
    this.nodes = rawNodes;
    this.edges = rawEdges;

    const nodes = rawNodes.map(node => ({
      id: node.id,
      label: node.name,
      level: { objective: 1, ticket: 2 }[node.type],
    }));

    // create an array with edges
    const edges = rawEdges.map(edge => {
      const { id, from, to } = edge;
      return {
        id,
        from,
        to,
      };
    });

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
    this.network = new Network(container, data, options);
  }

  render() {
    return html`
      <main>
        <div id="network"></div>

        <div>
          <input
            class="filter"
            name="q"
            .value="${this.q}"
            @input="${this.handleFilter}"
            placeholder="Ex: Parallel"
          />
          <table class="guide">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
              </tr>

              <tr></tr>
            </thead>

            <tbody>
              ${this.filteredNodes.map(
                node => html`
                  <tr
                    class="clickable"
                    @click=${this.handleFocusNode}
                    focusable
                    data-node-id="${node.id}"
                  >
                    <td>
                      ${node.id}
                    </td>
                    <td>
                      ${node.name}
                    </td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </main>
    `;
  }
}
