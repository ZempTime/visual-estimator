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

export default ({ nodes, edges, pointsPerSprint }) => {
  const _nodes1 = nodes.map(node => {
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

  const _nodes2 = _nodes1.map(node => {
    if (node.type === 'objective') {
      const dependentIds = []; // we sum these up
      const queue = edges.filter(edge => edge.to === node.id); // we've checked here

      while (queue.length > 0) {
        const edgeToExplore = queue.shift();
        dependentIds.push(edgeToExplore.from);

        edges.forEach(edge => {
          if (edge.to === edgeToExplore.from) {
            queue.push(edge);
          }
        });
      }

      const bounds = dependentIds.reduce(
        (acc, id) => {
          const _node = _nodes1.find(n => n.id === id);

          if (_node.type === 'ticket') {
            acc[0] += parseInt(_node.estimate, 10);
            acc[1] += parseInt(_node.estimate_upper, 10);
          }

          return acc;
        },
        [0, 0],
      );

      return {
        ...node,
        points: bounds,
        sprints: [
          calcSprints({ pointsPerSprint, points: bounds[0] }),
          calcSprints({ pointsPerSprint, points: bounds[1] }),
        ],
      };
    }
    return {
      ...node,
    };
  });

  return {
    nodes: _nodes2,
    edges,
  };
};
