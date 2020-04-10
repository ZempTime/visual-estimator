const host = 'visual-estimator.herokuapp.com/v1/';
const protocol = host.includes('localhost') ? 'http' : 'https';
const uri = `${protocol}://${host}/graphql`;
const query = `
  query {
    nodes {
      id
      name
      type
      estimate
      risk_level
    }
    edges {
      from
      to
    }
  }
`;

const fetchNodes = async () => {
  const response = await fetch(uri, { method: 'POST', body: JSON.stringify({ query }) });
  if (response.ok) {
    const res = await response.json();
    const { nodes, edges } = res.data;
    return {
      rawNodes: nodes,
      rawEdges: edges,
    };
  }
};

export { fetchNodes };
