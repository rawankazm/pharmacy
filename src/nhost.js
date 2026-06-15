const graphqlUrl = import.meta.env.VITE_NHOST_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';

export const nhostQuery = async (query, variables = {}) => {
    try {
        const response = await fetch(graphqlUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, variables })
        });
        const result = await response.json();
        if (result.errors) {
            console.error("GraphQL Errors:", result.errors);
            return { data: null, error: result.errors[0].message || result.errors };
        }
        return { data: result.data, error: null };
    } catch (err) {
        console.error("Nhost Request Failed:", err);
        return { data: null, error: err.message || err };
    }
};
