import { Plugin } from 'vite';
import { OutputAsset, OutputChunk } from 'rollup';
import { hash } from 'node:crypto';

export function singleInlinedHtml(): Plugin {
  return {
    name: 'single-inlined-html',
    enforce: 'post',
    generateBundle: (opt, bundle) => {
      // console.log('generateBundle', opt, bundle)
      const files = Object.keys(bundle);
      const htmlFiles = files.filter((i) => i.endsWith('.html'));
      if (htmlFiles.length < 1) {
        return;
      }
      if (htmlFiles.length > 1) {
        throw new Error(`Expected a single html file, got ${htmlFiles.length}: ${htmlFiles}`);
      }
      const cssAssets = files.filter((i) => i.endsWith('.css'));
      const jsAssets = files.filter((i) => /\.[mc]?js$/.test(i));
      const bundlesToDelete = [] as string[];
      const htmlFile = htmlFiles[0];
      const htmlChunk = bundle[htmlFile] as OutputAsset;
      let replacedHtml = htmlChunk.source as string;
      const scriptsSha256 = [] as string[];
      for (const jsName of jsAssets) {
        const jsChunk = bundle[jsName] as OutputChunk;
        if (jsChunk.code != null) {
          bundlesToDelete.push(jsName);
          const { html, sha256 } = replaceScript(replacedHtml, jsChunk.fileName, jsChunk.code);
          replacedHtml = html;
          scriptsSha256.push(sha256);
        }
      }
      for (const cssName of cssAssets) {
        const cssChunk = bundle[cssName] as OutputAsset;
        bundlesToDelete.push(cssName);
        replacedHtml = replaceCss(replacedHtml, cssChunk.fileName, cssChunk.source as string);
      }
      htmlChunk.source = replacedHtml;
      for (const name of bundlesToDelete) {
        delete bundle[name];
      }
      bundle[`${htmlFile}.metadata.json`] = {
        fileName: `${htmlFile}.metadata.json`,
        type: 'asset',
        source: JSON.stringify({ 'scripts-sha256': scriptsSha256.join(',') }),
      } as OutputAsset;
    },
  };
}

function replaceScript(html: string, scriptFilename: string, scriptCode: string) {
  const reScript = new RegExp(`<script([^>]*) src="[./]*${scriptFilename}"([^>]*)></script>`);
  const content = `\n${scriptCode}`;
  const sha256 = hash('sha256', content, 'base64');
  return {
    html: html.replace(reScript, `<script type="module">${content}</script>`),
    sha256,
  };
}

function replaceCss(html: string, scriptFilename: string, cssCode: string): string {
  const reStyle = new RegExp(`<link([^>]*) href="[./]*${scriptFilename}"([^>]*)>`);
  return html.replace(reStyle, `<style>\n${cssCode}</style>`);
}
