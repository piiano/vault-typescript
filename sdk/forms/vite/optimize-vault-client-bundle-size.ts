import { Plugin } from 'vite';

// Replace the errors dictionary repeated in every service to use a single shared errors object instead.
// This reduces the bundle size by ~50kb!.
export function optimizeVaultClientBundleSize(): Plugin {
  return {
    name: 'optimize-bundle-size',
    enforce: 'post',
    apply: 'build',
    transform(code, id) {
      // Remove the errors dictionary repeated in every service.
      if (/\/generated\/services\/.*Client\.js$/.test(id)) {
        return code.replace(/,\s*errors: \{[^}]*}/gm, '');
      }
      // Update the code to use a single errors map.
      if (/\/generated\/core\/request\.js$/.test(id)) {
        code.replace(
          /const errors = Object.assign\(\{.*}, options.errors\);/g,
          `const errors = ${JSON.stringify({
            400: 'The request is invalid.',
            401: 'Authentication credentials are incorrect or missing.',
            403: "The caller doesn't have the required access rights.",
            404: 'The requested resource is not found.',
            405: 'The operation is not allowed.',
            409: 'A conflict occurs.',
            410: 'Access to a resource that is no longer available occurs.',
            500: 'An error occurs on the server.',
            503: 'The service is unavailable.',
          })};`,
        );
      }
    },
  };
}
