import axios from 'axios';

// 1. Backend URL 
const api = axios.create({
    baseURL: 'http://localhost:8083/api', 
});

// 2.  Request  (Interceptor)
api.interceptors.request.use(
    (config) => {
        // Browser Doctor Data 
        const doctorData = localStorage.getItem('doctorData');
        const adminData = localStorage.getItem('adminData');
        const patientData = localStorage.getItem('patientData');

        let token = null;

        //  Token 
        if (doctorData) {
            const parsed = JSON.parse(doctorData);
            
            token = parsed.token || parsed.accessToken; 
        } 
        else if (adminData) {
            const parsed = JSON.parse(adminData);
            token = parsed.token;
        }
        else if (patientData) {
             const parsed = JSON.parse(patientData);
             token = parsed.token;
        }

        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;