import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
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

// Upload file
export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

// Delete file
export const deleteFile = async (fileUrl: string) => {
    const response = await api.delete('/upload/delete', {
        data: { fileUrl }
    });

    return response.data;
};

// Get test runs for a test case
export const getTestRuns = async (testCaseId: string) => {
    const response = await api.get(`/test-runs/test-case/${testCaseId}`);
    return response.data;
};

// Get latest test run for a test case
export const getLatestTestRun = async (testCaseId: string) => {
    const response = await api.get(`/test-runs/test-case/${testCaseId}/latest`);
    return response.data;
};

// Get latest test runs for multiple test cases
export const getLatestTestRunsBatch = async (testCaseIds: string[]) => {
    const response = await api.post('/test-runs/latest-batch', { testCaseIds });
    return response.data;
};

// Duplicate a single test case
export const duplicateTestCase = async (id: string, targetProjectId?: string) => {
    const response = await api.post(`/tests/${id}/duplicate`, { targetProjectId });
    return response.data;
};

// Move a single test case
export const moveTestCase = async (id: string, targetProjectId: string) => {
    const response = await api.patch(`/tests/${id}/move`, { targetProjectId });
    return response.data;
};

// Bulk duplicate test cases
export const bulkDuplicateTestCases = async (testCaseIds: string[], targetProjectId?: string) => {
    const response = await api.post('/tests/bulk/duplicate', { testCaseIds, targetProjectId });
    return response.data;
};

// Bulk move test cases
export const bulkMoveTestCases = async (testCaseIds: string[], targetProjectId: string) => {
    const response = await api.patch('/tests/bulk/move', { testCaseIds, targetProjectId });
    return response.data;
};

// Bulk delete test cases
export const bulkDeleteTestCases = async (testCaseIds: string[]) => {
    const response = await api.delete('/tests/bulk', { data: { testCaseIds } });
    return response.data;
};
