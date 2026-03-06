export const CONFIG = {
  get hostname() {
    return window.location.hostname;
  },
  get isLocal() {
    const hostname = this.hostname;
    return hostname.includes('localhost') || hostname.includes('127.0.0.1');
  },
  get baseUrl() {
    return this.isLocal
      ? 'http://localhost:8888/.netlify/functions'
      : `${window.location.origin}/.netlify/functions`;
  }
};
