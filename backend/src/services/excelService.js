const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');

const EXPORTS_DIR = path.join(__dirname, '../../exports');
const MASTER_FILE = path.join(EXPORTS_DIR, 'master_export.xlsx');

if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

// Queue system
let writeQueue = [];
let isWriting = false;

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const processQueue = async () => {
  if (isWriting || writeQueue.length === 0) return;
  isWriting = true;
  
  while (writeQueue.length > 0) {
    const nextTask = writeQueue.shift();
    try {
      await nextTask();
    } catch (err) {
      console.error('Excel Service Queue Error:', err.message);
    }
  }
  
  isWriting = false;
};

const queueOperation = (task) => {
  return new Promise((resolve, reject) => {
    writeQueue.push(async () => {
      let retries = 3;
      let backoff = 100;
      
      while (retries > 0) {
        try {
          await task();
          resolve();
          return;
        } catch (err) {
          retries--;
          if (retries === 0) {
            reject(err);
          } else {
            console.warn(`Excel operation failed. Retrying in ${backoff}ms... (${retries} left)`, err.message);
            await delay(backoff);
            backoff *= 2; // exponential backoff
          }
        }
      }
    });
    
    processQueue();
  });
};

const safeWriteExcel = (wb, targetPath) => {
  const tempPath = targetPath + '.temp.xlsx';
  try {
    xlsx.writeFile(wb, tempPath);
    // Atomic rename to prevent EBUSY locks and corruption
    fs.renameSync(tempPath, targetPath);
  } catch (err) {
    if (err.code === 'EBUSY' || err.code === 'EPERM') {
      console.error(`\n🚨 EXCEL LOCK ERROR: Cannot update ${targetPath}`);
      console.error(`👉 PLEASE CLOSE MICROSOFT EXCEL OR OTHER PROGRAMS USING THIS FILE!`);
    }
    throw err;
  }
};

const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '_' : '';
    const val = obj[k];
    
    if (val === null || val === undefined) {
      acc[pre + k] = '';
    } else if (val instanceof Date) {
      acc[pre + k] = val.toISOString();
    } else if (Array.isArray(val)) {
      try {
        acc[pre + k] = JSON.stringify(val);
      } catch (e) {
        acc[pre + k] = String(val);
      }
    } else if (typeof val === 'object' && val.toString() === '[object Object]') {
      if (val._id) {
        acc[pre + k] = String(val._id);
      } else {
        Object.assign(acc, flattenObject(val, pre + k));
      }
    } else {
      acc[pre + k] = String(val);
    }
    return acc;
  }, {});
};

const documentToRow = (doc) => {
  if (!doc) return {};
  const obj = doc.toObject ? doc.toObject() : doc;
  
  if (obj.__v !== undefined) delete obj.__v;
  if (obj._id) obj._id = String(obj._id);

  const flattened = flattenObject(obj);
  flattened.exportedAt = new Date().toISOString();
  return flattened;
};

const autoFitColumns = (ws, data) => {
  if (!data || data.length === 0) return;
  const objectMaxLength = [];
  
  const keys = Object.keys(data[0]);
  keys.forEach((key, i) => {
    objectMaxLength[i] = { wch: key.length + 2 };
  });

  data.forEach((row) => {
    keys.forEach((key, i) => {
      let value = row[key] ? String(row[key]) : "";
      if (value.length > 50) value = value.substring(0, 50);
      if (objectMaxLength[i].wch < value.length + 2) {
        objectMaxLength[i].wch = value.length + 2;
      }
    });
  });

  ws['!cols'] = objectMaxLength;
};

const getSheetName = (collectionName) => {
  if (!collectionName || typeof collectionName !== 'string') return 'Unknown';
  return collectionName.substring(0, 31);
};

const updateSheet = (wb, collectionName, updater) => {
  const sheetName = getSheetName(collectionName);
  let ws = wb.Sheets[sheetName];
  let data = [];
  
  if (ws) {
    data = xlsx.utils.sheet_to_json(ws);
  }
  
  data = updater(data);
  
  if (data.length === 0) data = [{}];
  
  const newWs = xlsx.utils.json_to_sheet(data);
  autoFitColumns(newWs, data);
  
  wb.Sheets[sheetName] = newWs;
  if (!wb.SheetNames.includes(sheetName)) {
    wb.SheetNames.push(sheetName);
  }
};

// =====================================
// Public Methods
// =====================================

exports.initializeExcel = () => {
  return queueOperation(async () => {
    console.log('📊 Initializing Master Excel export from MongoDB...');
    const wb = xlsx.utils.book_new();
    const models = mongoose.models;
    
    for (const modelName in models) {
      const Model = models[modelName];
      const docs = await Model.find({}).lean();
      
      let data = docs.map(d => documentToRow(d));
      if (data.length === 0) data = [{}];
      
      const ws = xlsx.utils.json_to_sheet(data);
      autoFitColumns(ws, data);
      
      const sheetName = getSheetName(modelName);
      xlsx.utils.book_append_sheet(wb, ws, sheetName);
    }

    safeWriteExcel(wb, MASTER_FILE);
    console.log('✅ Master Excel file initialized successfully.');
  });
};

exports.appendToExcel = (collectionName, document) => {
  return queueOperation(async () => {
    console.log(`📝 appendToExcel called for ${collectionName}, Doc ID: ${document._id}`);
    try {
      if (!fs.existsSync(MASTER_FILE)) {
        const wb = xlsx.utils.book_new();
        updateSheet(wb, collectionName, (data) => [documentToRow(document)]);
        safeWriteExcel(wb, MASTER_FILE);
        console.log(`✅ Successfully created master file and appended new ${collectionName}`);
        return;
      }

      const wb = xlsx.readFile(MASTER_FILE);
      updateSheet(wb, collectionName, (data) => {
        const newRow = documentToRow(document);
        const exists = data.some(row => String(row._id) === String(newRow._id));
        if (!exists) {
          data.push(newRow);
        }
        return data;
      });

      safeWriteExcel(wb, MASTER_FILE);
      console.log(`✅ Successfully appended new ${collectionName} to Excel`);
    } catch (err) {
      console.error(`❌ Failed to append ${collectionName} to Excel:`, err.message);
      throw err;
    }
  });
};

exports.updateInExcel = (collectionName, documentId, updatedDoc) => {
  return queueOperation(async () => {
    console.log(`📝 updateInExcel called for ${collectionName}, Doc ID: ${documentId}`);
    try {
      if (!fs.existsSync(MASTER_FILE)) return;

      const wb = xlsx.readFile(MASTER_FILE);
      
      updateSheet(wb, collectionName, (data) => {
        const updateRow = documentToRow(updatedDoc);
        const index = data.findIndex(row => String(row._id) === String(documentId));
        
        if (index !== -1) {
          data[index] = { ...data[index], ...updateRow };
        } else {
          data.push(updateRow);
        }
        return data;
      });

      safeWriteExcel(wb, MASTER_FILE);
      console.log(`✅ Successfully updated ${collectionName} in Excel`);
    } catch (err) {
      console.error(`❌ Failed to update ${collectionName} in Excel:`, err.message);
      throw err;
    }
  });
};

exports.deleteFromExcel = (collectionName, documentId) => {
  return queueOperation(async () => {
    console.log(`🗑️ deleteFromExcel called for ${collectionName}, Doc ID: ${documentId}`);
    try {
      if (!fs.existsSync(MASTER_FILE)) return;

      const wb = xlsx.readFile(MASTER_FILE);
      
      updateSheet(wb, collectionName, (data) => {
        const index = data.findIndex(row => String(row._id) === String(documentId));
        if (index !== -1) {
          data.splice(index, 1);
        }
        return data;
      });

      safeWriteExcel(wb, MASTER_FILE);
      console.log(`✅ Successfully deleted ${collectionName} from Excel`);
    } catch (err) {
      console.error(`❌ Failed to delete ${collectionName} from Excel:`, err.message);
      throw err;
    }
  });
};

exports.getMasterFile = () => MASTER_FILE;
