async function apiFetch(endpoint, method, body = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include' 
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(endpoint, options);
        
        const contentType = response.headers.get("content-type");
        let data;
        
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { success: false, message: `Error del servidor (${response.status}): ${text.substring(0, 50)}...` };
        }

        if (!response.ok) {
            throw data; 
        }

        return data; 

    } catch (error) {
        console.error('Error en apiFetch:', error);
        throw error; 
    }
}