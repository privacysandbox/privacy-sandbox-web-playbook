class Simple {
  async run(urls, data) {
    if (!data.hasOwnProperty("wasmBytes")) {
      console.error("missing data input for wasmBytes");
      return -1;
    }
    const wasmBytes = data["wasmBytes"];
    const buffer = wasmBytes.buffer;
    let index = -1;
    let instance = null;
    const importObject = {
      imports: {
        imported_func: (arg) => {
          console.log(arg);
        },
      },
    };
    try {
      const isValid = WebAssembly.validate(buffer);
      console.log(
        `The given bytes ${isValid ? "are" : "are not"} a valid wasm module`
      );
      const result = await WebAssembly.instantiate(buffer, importObject);
      instance = result.instance;
      result.instance.exports.exported_func();
      console.log("successfully instantiated");
      index = 1;
    } catch (error) {
      console.error("Error loading Wasm for simple:", error);
    }
    console.log("instance:", Boolean(instance));
    console.log("index:", index);
    return index;
  }
}

register("simple", Simple);
