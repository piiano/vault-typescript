import { Plugin } from 'vite';
import { OutputAsset, OutputChunk } from 'rollup';

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
      for (const jsName of jsAssets) {
        const jsChunk = bundle[jsName] as OutputChunk;
        if (jsChunk.code != null) {
          bundlesToDelete.push(jsName);
          replacedHtml = replaceScript(replacedHtml, jsChunk.fileName, jsChunk.code);
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
    },
  };
}

function replaceScript(html: string, scriptFilename: string, scriptCode: string): string {
  const reScript = new RegExp(`<script([^>]*) src="[./]*${scriptFilename}"([^>]*)></script>`);
  return html.replace(reScript, `<script type="module">\n${scriptCode}</script>`);
}

function replaceCss(html: string, scriptFilename: string, cssCode: string): string {
  const reStyle = new RegExp(`<link([^>]*) href="[./]*${scriptFilename}"([^>]*)>`);
  return html.replace(reStyle, `<style>\n${cssCode}</style>`);
}
