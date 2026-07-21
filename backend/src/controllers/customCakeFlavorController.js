const CustomCakeFlavor = require('../models/CustomCakeFlavor');

exports.getAllFlavors = async (req, res, next) => {
  try {
    const flavors = await CustomCakeFlavor.find({ isActive: true }).sort({ category: 1, name: 1 });
    res.status(200).json({
      success: true,
      data: flavors
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllFlavorsAdmin = async (req, res, next) => {
  try {
    const flavors = await CustomCakeFlavor.find().sort({ category: 1, name: 1 });
    res.status(200).json({
      success: true,
      data: flavors
    });
  } catch (error) {
    next(error);
  }
};

const calculateWeights = (basePrice) => {
  return [
    { kg: 1, price: basePrice },
    { kg: 1.5, price: basePrice + (basePrice / 2) },
    { kg: 2, price: basePrice * 2 },
    { kg: 2.5, price: basePrice * 2.5 },
    { kg: 3, price: basePrice * 3 }
  ];
};

exports.createFlavor = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload. Must be an object or an array of objects.' });
    }

    const isArray = Array.isArray(req.body);

    if (isArray && req.body.length === 0) {
      return res.status(400).json({ success: false, message: 'Array cannot be empty.' });
    }

    let createdRecords;
    let count = 0;

    if (isArray) {
      const processedData = req.body.map(item => {
        const data = { ...item };
        // Ensure client-provided _id is removed to avoid duplicate key errors
        if (data._id) delete data._id;
        const basePrice = data.pricePerKg || data.basePrice;
        if (basePrice) {
          data.weights = calculateWeights(Number(basePrice));
        }
        return data;
      });

      createdRecords = await CustomCakeFlavor.insertMany(processedData);
      count = createdRecords.length;
    } else {
      const data = { ...req.body };
      if (data._id) delete data._id;
      const basePrice = data.pricePerKg || data.basePrice;
      if (basePrice) {
        data.weights = calculateWeights(Number(basePrice));
      }

      createdRecords = await CustomCakeFlavor.create(data);
      count = 1;
    }

    res.status(201).json({
      success: true,
      count,
      data: createdRecords
    });
  } catch (error) {
    next(error);
  }
};

exports.updateFlavor = async (req, res, next) => {
  try {
    const data = { ...req.body };
    const basePrice = data.pricePerKg || data.basePrice;
    if (basePrice) {
      data.weights = calculateWeights(Number(basePrice));
    }
    const flavor = await CustomCakeFlavor.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });
    
    if (!flavor) {
      return res.status(404).json({ success: false, message: 'Flavor not found' });
    }
    
    res.status(200).json({
      success: true,
      data: flavor
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteFlavor = async (req, res, next) => {
  try {
    const flavor = await CustomCakeFlavor.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};


