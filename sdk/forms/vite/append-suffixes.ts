import { Plugin } from 'vite';
import path from 'node:path';

export function appendSuffixes({ name, suffixes }: { name: string; suffixes: string[] }): Plugin {
  return {
    name: 'add-version-to-artifacts',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const entries = Object.entries(bundle).filter(([fileName]) => !fileName.endsWith('.metadata.json'));
      if (entries.length !== 1) {
        throw Error('Expecting a single bundle artifact');
      }
      const [[fileName, chunk]] = entries;

      const ext = path.extname(name);
      const basename = path.basename(name, ext);

      delete bundle[fileName];
      for (const suffix of suffixes) {
        const newFileName = `${basename}-${suffix}${ext}`;
        bundle[newFileName] = { ...chunk, fileName: newFileName };
        const metadataFileName = `${fileName}.metadata.json`;
        if (bundle[metadataFileName]) {
          const metadata = bundle[metadataFileName];
          delete bundle[metadataFileName];
          bundle[`${newFileName}.metadata.json`] = { ...metadata, fileName: `${newFileName}.metadata.json` };
        }
      }
    },
  };
}
