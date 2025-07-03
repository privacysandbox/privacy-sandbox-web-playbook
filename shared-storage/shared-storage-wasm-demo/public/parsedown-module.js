class Parsedown {
  async run(urls, data) {
    if (!data.hasOwnProperty('markdown')) {
      console.error('missing data input for markdown');
      return -1;
    }
    if (!data.hasOwnProperty('jsString')) {
      console.error('missing data input for jsString');
      return -1;
    }
    if (!data.hasOwnProperty('wasmBytes')) {
      console.error('missing data input for wasmBytes');
      return -1;
    }
    const markdown = data['markdown'];
    const jsString = data['jsString'];
    const wasmBytes = data['wasmBytes'];
    const context = eval?.(jsString);
    
    await instantiate(wasmBytes);
    const textResult = markdown_to_plaintext(markdown, {});
    await sharedStorage.set('parsed markdown', textResult);
    console.log(textResult);
    console.log(textResult.length);
    console.log(textResult.length % urls.length)
    return textResult.length % urls.length;
  }
}

register('parsedown', Parsedown);