const excelService = require('../services/excelService');

module.exports = exports = function mongooseExcelPlugin(schema, options) {
  // We attach hooks to mongoose schema to listen for changes
  
  // 1. Post Save (Create or Update via .save())
  schema.post('save', function(doc) {
    if (!doc) return;
    const modelName = this.constructor.modelName;
    // We check if it's new by relying on mongoose internals, but save() could be update too.
    // updateRecordInExcel handles both (appends if not found).
    excelService.updateRecordInExcel(modelName, doc);
  });

  // 2. Post Update/FindOneAndUpdate
  const updateHooks = ['findOneAndUpdate', 'findByIdAndUpdate', 'updateOne', 'updateMany'];
  updateHooks.forEach(hook => {
    schema.post(hook, async function(res) {
      // res could be the document if `{ new: true }` was passed, otherwise it might be query metadata.
      // It's safer to fetch the updated document using the query condition.
      if (!res) return;
      
      try {
        const modelName = this.model.modelName;
        // In Mongoose 6+, post hooks for findOneAndUpdate get the updated document if new:true
        // If we don't have the doc, we might need to find it, but let's assume `res` has it if it's an object with _id
        if (res && res._id) {
          excelService.updateRecordInExcel(modelName, res);
        } else {
           // Fallback: If updateMany, res is a ModifyResult, we can't easily sync all dynamically without re-querying
           // For now, we sync the document if available
           const doc = await this.model.findOne(this.getQuery()).lean();
           if (doc) excelService.updateRecordInExcel(modelName, doc);
        }
      } catch (e) {
        console.error('Error in mongooseExcelPlugin update hook:', e);
      }
    });
  });

  // 3. Post Delete/FindOneAndDelete
  const deleteHooks = ['findOneAndDelete', 'findByIdAndDelete', 'deleteOne', 'deleteMany'];
  deleteHooks.forEach(hook => {
    schema.post(hook, function(res) {
      if (!res) return;
      const modelName = this.model.modelName;
      if (res && res._id) {
        excelService.deleteRecordFromExcel(modelName, res._id);
      } else {
         // If it's query condition we try to extract _id
         const query = this.getQuery();
         if (query && query._id) {
            excelService.deleteRecordFromExcel(modelName, query._id);
         }
      }
    });
  });
};
