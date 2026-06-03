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

exports.createFlavor = async (req, res, next) => {
  try {
    const flavor = await CustomCakeFlavor.create(req.body);
    res.status(201).json({
      success: true,
      data: flavor
    });
  } catch (error) {
    next(error);
  }
};

exports.updateFlavor = async (req, res, next) => {
  try {
    const flavor = await CustomCakeFlavor.findByIdAndUpdate(req.params.id, req.body, {
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
    
    if (!flavor) {
      return res.status(404).json({ success: false, message: 'Flavor not found' });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
