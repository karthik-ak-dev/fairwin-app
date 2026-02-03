// API client for making authenticated requests
// Responsibilities:
// - Create axios/fetch instance with base URL
// - Attach JWT token to Authorization header
// - Handle 401 errors (logout user)
// - Request/response interceptors
// - Export typed API methods: get, post, patch, delete
// - Used by all hooks to make API calls
