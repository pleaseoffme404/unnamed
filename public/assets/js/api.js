const api = {
    baseUrl: '/api',

    async _fetch(url, options = {}) {
        options.credentials = 'include';

        if (options.body && !(options.body instanceof FormData)) {
            options.headers = {
                'Content-Type': 'application/json',
                ...options.headers,
            };
            options.body = JSON.stringify(options.body);
        }
        
        try {
            const response = await fetch(this.baseUrl + url, options);
            
            if (response.status === 401) {
                console.error('No autorizado. Redirigiendo al login.');
                window.location.href = '/index.html'; 
                return Promise.reject(new Error('No autorizado'));
            }

            const data = await response.json();

            if (!response.ok) {
                return Promise.reject(data);
            }
            
            return data;

        } catch (error) {
            console.error('Error de red o fetch:', error);
            return Promise.reject({ success: false, message: 'Error de red. ¿El servidor está caído?' });
        }
    },

    get(url) {
        return this._fetch(url, { method: 'GET' });
    },

    post(url, data) {
        return this._fetch(url, { method: 'POST', body: data });
    },
    
    postForm(url, formData) {
        return this._fetch(url, { method: 'POST', body: formData });
    },

    putForm(url, formData) {
        return this._fetch(url, { method: 'PUT', body: formData });
    },

    delete(url) {
        return this._fetch(url, { method: 'DELETE' });
    }
};