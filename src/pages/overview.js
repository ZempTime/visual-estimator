import { LitElement, html, css } from 'lit-element';

import { Network } from 'https://unpkg.com/vis-network?module';
import { fetchNodes } from '../api';
import calculate from '../data';

export class OverviewPage extends LitElement {
  static get properties() {
    return {
      network: { type: Object },
      nodes: { type: Array },
      edges: { type: Array },
      objectiveQuery: { type: String },
      ticketQuery: { type: String },
      pointsPerSprint: { type: Number },
      __rawNodes: { type: Array },
      __rawEdges: { type: Array },
    };
  }

  constructor() {
    super();
    this.nodes = [];
    this.edges = [];
    this.objectiveQuery = '';
    this.ticketQuery = '';
    this.pointsPerSprint = 16;
  }

  updated(changedProperties) {
    super.updated();
    if (changedProperties.has('pointsPerSprint')) {
      this.applyNetwork();
    }
  }

  static get styles() {
    return css`
      .container {
        flex-grow: 1;
      }

      #network {
        margin-top: 30px;
        width: 100%;
        height: 500px;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
      }

      table,
      th,
      td {
        border-collapse: collapse;
        text-align: left;
        font-size: 10px;
        border: 1px solid lightgray;
      }

      th,
      td {
        padding: 15px;
      }

      .filter {
        width: 50%;
        padding: 12px 20px;
        margin: 8px 0;
        box-sizing: border-box;
        font-size: 12px;
      }

      .clickable {
        cursor: pointer;
      }
      .clickable:hover {
        background-color: #f3f3f3;
      }

      .spacer {
        margin: 10px;
      }
    `;
  }

  get filteredObjectives() {
    const filtered = this.nodes.filter(n => n.type === 'objective');
    if (this.objectiveQuery === '') return filtered;
    return filtered.filter(n => n.name.toLowerCase().includes(this.objectiveQuery.toLowerCase()));
  }

  get filteredTickets() {
    const filtered = this.nodes.filter(n => n.type === 'ticket');
    if (this.ticketQuery === '') return filtered;
    return filtered.filter(n => n.name.toLowerCase().includes(this.ticketQuery.toLowerCase()));
  }

  handleFilter(e) {
    this[e.target.name] = e.target.value;
  }

  handleFocusNode(e) {
    const focusedTr = e.composedPath().find(el => el.hasAttribute && el.hasAttribute('focusable'));
    const nodeId = parseInt(focusedTr.dataset.nodeId, 10);
    this.network.focus(nodeId, { scale: 0.5, animation: true });
  }

  async applyNetwork() {
    if (!this.__rawNodes || this.__rawEdges) {
      const { rawNodes, rawEdges } = await fetchNodes();
      this.__rawNodes = rawNodes;
      this.__rawEdges = rawEdges;
    }

    const { nodes, edges } = calculate({
      nodes: this.__rawNodes,
      edges: this.__rawEdges,
      pointsPerSprint: this.pointsPerSprint,
    });

    // compute
    this.nodes = nodes;
    this.edges = edges;

    const visNodes = this.nodes.map(node => ({
      id: node.id,
      label: node.name,
      shape: { object: 'circle', ticket: 'box' }[node.type],
      color: { objective: '#FFA500' }[node.type],
    }));

    // create an array with edges
    const visEdges = this.edges.map(edge => {
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
      nodes: visNodes,
      edges: visEdges,
    };
    const options = {
      layout: {
        hierarchical: {
          enabled: true,
          sortMethod: 'directed',
          shakeTowards: 'roots',
        },
      },
      height: '100%',
      width: '100%',
    };
    this.network = new Network(container, data, options);
    this.network.focus('13', { scale: 0.5, animation: true });
  }

  render() {
    return html`
      <div class="container">
        <div id="network"></div>
        Points per Sprint:
        <input
          name="pointsPerSprint"
          .value="${this.pointsPerSprint}"
          @input="${this.handleFilter}"
        />
        <br />
        <table class="guide" style="float: left;">
          <thead>
            <tr>
              <th>#</th>
              <th>
                Objectives
                <input
                  class="filter"
                  name="objectiveQuery"
                  .value="${this.objectiveQuery}"
                  @input="${this.handleFilter}"
                  placeholder="Ex: Parallel"
                />
              </th>
              <th># Points (Individual)</th>
              <th># Sprints (Individual)</th>
              <th># Points (Cumulative)</th>
              <th># Sprints (Cumulative)</th>
            </tr>
            <tr></tr>
          </thead>
          <tbody>
            ${this.filteredObjectives.map(
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
                  <td>
                    ${node.pointsInd[0]} - ${node.pointsInd[1]}
                  </td>
                  <td>
                    ${node.sprintsInd[0]} - ${node.sprintsInd[1]}
                  </td>
                  <td>
                    ${node.pointsCumulative[0]} - ${node.pointsCumulative[1]}
                  </td>
                  <td>
                    ${node.sprintsCumulative[0]} - ${node.sprintsCumulative[1]}
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>

        <span class="spacer"></span>

        <table class="guide">
          <thead>
            <tr>
              <th>#</th>
              <th>
                Tickets
                <input
                  class="filter"
                  name="ticketQuery"
                  .value="${this.ticketQuery}"
                  @input="${this.handleFilter}"
                  placeholder="Ex: Parallel"
                />
              </th>
              <th># Points</th>
              <th>tags</th>
            </tr>
            <tr></tr>
          </thead>
          <tbody>
            ${this.filteredTickets.map(
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
                  <td>
                    ${node.estimate} - ${node.estimate_upper}
                  </td>
                  <td>
                    ${node.tags}
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}
