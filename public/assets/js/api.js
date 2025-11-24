async function apiFetch(endpoint, method, body = null) {
    const options = {
        method: method,
        headers: {},
        credentials: 'include'
    };

    if (body) {
        if (body instanceof FormData) {
            options.body = body;
        } else {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
    }

    try {
        const response = await fetch(endpoint, options);
        
        const contentType = response.headers.get("content-type");
        let data;
        
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { success: false, message: response.statusText || 'Error del servidor' };
        }

        if (!response.ok) {
            throw data; 
        }

        return data; 

    } catch (error) {
        console.error(error);
        throw error; 
    }
}