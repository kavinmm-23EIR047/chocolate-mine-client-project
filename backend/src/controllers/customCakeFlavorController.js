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

exports.seedFlavors = async (req, res, next) => {
  try {
    const flavorsList = [
      // Vanilla Cakes
      { name: 'Classic Vanilla', category: 'Vanilla Cakes', pricePerKg: 520 },
      { name: 'White Forest', category: 'Vanilla Cakes', pricePerKg: 560 },
      { name: 'Fresh Pineapple', category: 'Vanilla Cakes', pricePerKg: 650 },
      { name: 'Fruits & Nuts', category: 'Vanilla Cakes', pricePerKg: 690 },
      { name: 'Honey & Almond', category: 'Vanilla Cakes', pricePerKg: 690 },
      { name: 'Rose Milk', category: 'Vanilla Cakes', pricePerKg: 690 },
      { name: 'Filter Coffee', category: 'Vanilla Cakes', pricePerKg: 730 },
      { name: 'Gulab Jamun', category: 'Vanilla Cakes', pricePerKg: 770 },
      { name: 'Honey & Lychee', category: 'Vanilla Cakes', pricePerKg: 780 },
      { name: 'Rose & Lychee', category: 'Vanilla Cakes', pricePerKg: 780 },
      { name: 'Vancho', category: 'Vanilla Cakes', pricePerKg: 830 },
      { name: 'Royal Gulkand', category: 'Vanilla Cakes', pricePerKg: 830 },
      { name: 'Rasmalai', category: 'Vanilla Cakes', pricePerKg: 850 },
      { name: 'Fresh Strawberry', category: 'Vanilla Cakes', pricePerKg: 870 },
      { name: 'Lotus Biscoff', category: 'Vanilla Cakes', pricePerKg: 890 },
      { name: 'Fresh Blueberry', category: 'Vanilla Cakes', pricePerKg: 890 },
      { name: 'Very Berry', category: 'Vanilla Cakes', pricePerKg: 950 },
      
      // Chocolate Cakes
      { name: 'Black Forest', category: 'Chocolate Cakes', pricePerKg: 560 },
      { name: 'Choco Fudge', category: 'Chocolate Cakes', pricePerKg: 610 },
      { name: 'Choco Oreo', category: 'Chocolate Cakes', pricePerKg: 670 },
      { name: 'Choco Truffle', category: 'Chocolate Cakes', pricePerKg: 670 },
      { name: 'Choco Caramel', category: 'Chocolate Cakes', pricePerKg: 690 },
      { name: 'Mocha Walnut', category: 'Chocolate Cakes', pricePerKg: 690 },
      { name: 'Choco Bounty', category: 'Chocolate Cakes', pricePerKg: 750 },
      { name: 'Death By Chocolate', category: 'Chocolate Cakes', pricePerKg: 750 },
      { name: 'Choco Orange', category: 'Chocolate Cakes', pricePerKg: 770 },
      { name: 'Nutty Truffle', category: 'Chocolate Cakes', pricePerKg: 780 },
      { name: 'Choco Hazelnut', category: 'Chocolate Cakes', pricePerKg: 780 },
      { name: 'Choco Strawberry', category: 'Chocolate Cakes', pricePerKg: 870 },
      { name: 'Red Velvet', category: 'Chocolate Cakes', pricePerKg: 870 },
      { name: 'Choco Blueberry', category: 'Chocolate Cakes', pricePerKg: 890 },
      { name: 'Choco Biscoff', category: 'Chocolate Cakes', pricePerKg: 890 },
      { name: 'Kinder Bueno', category: 'Chocolate Cakes', pricePerKg: 890 },
      { name: 'Choco Ferrero', category: 'Chocolate Cakes', pricePerKg: 930 },
      { name: 'Choco Pistachio', category: 'Chocolate Cakes', pricePerKg: 950 },
      
      // Red Velvet Cakes
      { name: 'Red Velvet', category: 'Red Velvet Cakes', pricePerKg: 870 }
    ];

    await CustomCakeFlavor.deleteMany({});
    try {
      await CustomCakeFlavor.collection.dropIndexes();
    } catch (e) {
      // Ignored
    }
    const seeded = await CustomCakeFlavor.insertMany(flavorsList);
    
    res.status(200).json({
      success: true,
      message: 'Successfully seeded custom cake flavors',
      count: seeded.length
    });
  } catch (error) {
    next(error);
  }
};
