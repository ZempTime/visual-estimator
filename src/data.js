const calcSprints = ({ pointsPerSprint, points }) => {
  return points / pointsPerSprint;
};

const riskLevels = {
  none: 1.0,
  low: 1.3,
  medium: 1.7,
  large: 2.5,
};

const calcUpperBound = ({ estimate, risk_level }) => {
  return estimate * (riskLevels[risk_level] || 1.0);
};

const getNodeType = ({ nodes, id }) => {
  return nodes.find(n => n.id === id).type;
};

const ticketEdgesForNodeId = ({ edges, id, nodes }) => {
  return edges.filter(edge => edge.to === id && getNodeType({ nodes, id }) === 'ticket');
};

const allEdgesForNodeId = ({ edges, id }) => {
  return edges.filter(edge => edge.to === id);
};

export default ({ nodes, edges, pointsPerSprint }) => {
  const _nodesWithPoints = nodes.map(node => {
    if (node.type === 'ticket') {
      return {
        ...node,
        estimate_upper: calcUpperBound({
          estimate: node.estimate,
          risk_level: node.risk_level,
        }),
      };
    }
    return {
      ...node,
    };
  });

  const _nodesWithSums = _nodesWithPoints.map(currentNode => {
    if (currentNode.type === 'objective') {
      const directTickets = []; // tickets directly tied to objective (individual)
      const directTicketsQueue = allEdgesForNodeId({
        edges,
        id: currentNode.id,
      }).filter(e => _nodesWithPoints.find(n => n.id === e.from).type === 'ticket');

      while (directTicketsQueue.length > 0) {
        const edgeToExplore = directTicketsQueue.shift();
        const potentialNode = _nodesWithPoints.find(n => n.id === edgeToExplore.from);
        if (potentialNode.type === 'ticket') {
          directTickets.push(potentialNode);
          const directTicketEdges = allEdgesForNodeId({
            edges,
            id: potentialNode.id,
          }).filter(e => _nodesWithPoints.find(n => n.id === e.from).type === 'ticket');
          directTicketsQueue.push(...directTicketEdges);
        }
      }

      const boundsInd = directTickets.reduce(
        (acc, node) => {
          if (node.type === 'ticket') {
            acc[0] += parseInt(node.estimate, 10);
            acc[1] += parseInt(node.estimate_upper, 10);
          }

          return acc;
        },
        [0, 0],
      );

      const allTickets = []; // all tickets required for given objective (cumulative)
      const allTicketsQueue = allEdgesForNodeId({ edges, id: currentNode.id });

      while (allTicketsQueue.length > 0) {
        const edgeToExplore = allTicketsQueue.shift();
        const potentialNode = _nodesWithPoints.find(n => n.id === edgeToExplore.from);
        if (potentialNode.type === 'ticket') {
          allTickets.push(potentialNode);
        }
        allTicketsQueue.push(...allEdgesForNodeId({ edges, id: potentialNode.id }));
      }

      const boundsCumulative = allTickets.reduce(
        (acc, node) => {
          if (node.type === 'ticket') {
            acc[0] += parseInt(node.estimate, 10);
            acc[1] += parseInt(node.estimate_upper, 10);
          }

          return acc;
        },
        [0, 0],
      );

      return {
        ...currentNode,
        pointsInd: boundsInd,
        sprintsInd: [
          calcSprints({ pointsPerSprint, points: boundsInd[0] }),
          calcSprints({ pointsPerSprint, points: boundsInd[1] }),
        ],
        pointsCumulative: boundsCumulative,
        sprintsCumulative: [
          calcSprints({ pointsPerSprint, points: boundsCumulative[0] }),
          calcSprints({ pointsPerSprint, points: boundsCumulative[1] }),
        ],
      };
    }
    return {
      ...currentNode,
    };
  });

  return {
    nodes: _nodesWithSums,
    edges,
  };
};
