module.exports = {
  process(sourceText, sourcePath, options) {
    // Inject function exports into the source code
    const functionRegex = /function\s+([\w$]+)\s*\(/g;
    const functionNames = [];
    let match;
    while ((match = functionRegex.exec(sourceText))) {
      functionNames.push(match[1]);
    }
    let exports = "";
    if (functionNames.find((value) => value === "decodeUplink")) {
      exports += "exports.decodeUplink = decodeUplink;\n";
    }
    if (functionNames.find((value) => value === "decodeDownlink")) {
      exports += "exports.decodeDownlink = decodeDownlink;\n";
    }
    if (functionNames.find((value) => value === "encodeDownlink")) {
      exports += "exports.encodeDownlink = encodeDownlink;\n";
    }
    const injectedCode = `
    ${sourceText}
    ${exports}
    `;
    return { code: injectedCode };
  },
};
