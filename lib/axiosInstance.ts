'use client';

import axios, {
	AxiosError,
	AxiosHeaders,
	InternalAxiosRequestConfig,
} from 'axios';
import Cookies from 'js-cookie';

axios.defaults.baseURL = process.env.NEXT_PUBLIC_BASE_URL;
axios.defaults.withCredentials = true;

const redirectToLogin = () => {
	if (typeof window === 'undefined') {
		return;
	}

	try {
		Cookies.remove('auth');
		try {
			if (typeof window !== 'undefined') {
				localStorage.removeItem('institution-theme');
				localStorage.removeItem('user-profile');
			}
		} catch {}
	} catch (error) {
		console.error('Failed to clear auth cookie', error);
	}

	if (!window.location.pathname.startsWith('/login')) {
		window.location.replace('/login');
	}
};

axios.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		if (typeof window === 'undefined') {
			return config;
		}

		const authCookie = Cookies.get('auth');

		if (authCookie) {
			try {
				const parsedAuth = JSON.parse(authCookie);
				if (parsedAuth?.token) {
					if (!config.headers) {
						config.headers = new AxiosHeaders();
					}

					const headers = config.headers as AxiosHeaders;
					headers.set('Authorization', `Bearer ${parsedAuth.token}`);
				}
			} catch (error) {
				console.error('Invalid auth cookie', error);
			}
		}

		return config;
	},
	(error: AxiosError) => Promise.reject(error)
);

axios.interceptors.response.use(
	(response) => response,
	(error: AxiosError) => {
		const status = error?.response?.status;
		const headers = error.config?.headers;

		let hasAuthHeader = false;

		if (headers instanceof AxiosHeaders) {
			hasAuthHeader = headers.has('Authorization');
		} else if (headers && typeof headers === 'object') {
			const normalizedHeaders = headers as Record<string, unknown>;
			hasAuthHeader = Boolean(normalizedHeaders['Authorization'] || normalizedHeaders['authorization']);
		}

		if (status === 401 && hasAuthHeader) {
			redirectToLogin();
		}

		return Promise.reject(error);
	}
);

export { redirectToLogin };

export default axios;
