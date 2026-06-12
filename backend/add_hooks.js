const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src/models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

const hooksTemplate = `
// ==========================================
// Excel Synchronization Hooks
// ==========================================
const excelService = require('../services/excelService');

schemaToHook.post('save', async function(doc) {
  try {
    if (doc) await excelService.appendToExcel(this.constructor.modelName || this.modelName, doc);
  } catch (err) {
    console.error("Excel sync error for save:", err.message);
  }
});

schemaToHook.post(['findOneAndUpdate', 'updateOne', 'findByIdAndUpdate'], async function(doc) {
  try {
    const modelName = this.model.modelName;
    const query = this.getQuery();
    if (doc && doc._id) {
      await excelService.updateInExcel(modelName, doc._id, doc);
    } else if (query && query._id) {
      const updatedDoc = await this.model.findOne(query).lean();
      if (updatedDoc) await excelService.updateInExcel(modelName, query._id, updatedDoc);
    }
  } catch (err) {
    console.error("Excel sync error for update:", err.message);
  }
});

schemaToHook.post(['findOneAndDelete', 'deleteOne', 'findByIdAndDelete'], async function(doc) {
  try {
    const modelName = this.model.modelName;
    if (doc && doc._id) {
      await excelService.deleteFromExcel(modelName, doc._id);
    } else {
      const query = this.getQuery();
      if (query && query._id) {
         await excelService.deleteFromExcel(modelName, query._id);
      }
    }
  } catch (err) {
    console.error("Excel sync error for delete:", err.message);
  }
});

module.exports = mongoose.model(modelNameLiteral, schemaToHook);
`;

files.forEach(file => {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Clean up existing hooks block if it exists
  const hooksStart = content.indexOf('// ==========================================');
  if (hooksStart !== -1 && content.includes('Excel Synchronization Hooks')) {
    // find module.exports
    const modExportMatch = content.match(/module\.exports\s*=\s*mongoose\.model\(['"]([^'"]+)['"],\s*([^)]+)\);?/);
    if (modExportMatch) {
      // Remove everything from hooksStart to end
      content = content.substring(0, hooksStart);
      // Append new hooks
      const modelNameLiteral = "'" + modExportMatch[1] + "'";
      const schemaName = modExportMatch[2];
      const finalizedHooks = hooksTemplate
        .replace(/schemaToHook/g, schemaName)
        .replace(/modelNameLiteral/g, modelNameLiteral);
      content += finalizedHooks;
      fs.writeFileSync(filePath, content);
      console.log("Updated " + file);
    }
  } else {
    // If no hooks block exists, find module.exports and replace
    const modExportMatch = content.match(/module\.exports\s*=\s*mongoose\.model\(['"]([^'"]+)['"],\s*([^)]+)\);?/);
    if (modExportMatch) {
      const fullMatch = modExportMatch[0];
      content = content.replace(fullMatch, ''); // remove it
      
      const modelNameLiteral = "'" + modExportMatch[1] + "'";
      const schemaName = modExportMatch[2];
      const finalizedHooks = hooksTemplate
        .replace(/schemaToHook/g, schemaName)
        .replace(/modelNameLiteral/g, modelNameLiteral);
      
      content += finalizedHooks;
      fs.writeFileSync(filePath, content);
      console.log("Added to " + file);
    } else {
      console.log("Could not find module.exports in " + file);
    }
  }
});
