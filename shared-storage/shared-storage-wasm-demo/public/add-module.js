class Add {
  async run(urls, data) {
    if (!data.hasOwnProperty('x') || !data.hasOwnProperty('y')) {
      console.error('missing data input for x and/or y');
      return -1;
    }
    if (!data.hasOwnProperty('wasmBytes')) {
      console.error('missing data input for wasmBytes');
      return -1;
    }
    const wasmBytes = data['wasmBytes'];
    const buffer = wasmBytes.buffer;
    let index = -1;
    let instance = null;
    const importObject = {
      imports: {
        imported_func: arg => {
          console.log(arg);
        }
      }
    };
    try {
      const isValid = WebAssembly.validate(buffer);
      console.log(`The given bytes ${isValid ? "are" : "are not"} a valid wasm module`);
      const result = await WebAssembly.instantiate(buffer, importObject);
      instance = result.instance;
      console.log("instantiated wasm for add; ", instance.exports.add(5, 3)); 
      index = instance.exports.add(parseInt(data['x']), parseInt(data['y'])) % urls.length;
    } catch (error) {
      console.error("Error loading Wasm for add:", error); 
    }
    console.log('instance:', Boolean(instance));
    console.log('index:', index);
    return index;
  }
}

register('add', Add);