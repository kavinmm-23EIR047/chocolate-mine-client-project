const mongoose = require('mongoose');
require('dotenv').config();

const CustomCakeTheme = require('./src/models/CustomCakeTheme');
const CustomCakeFlavor = require('./src/models/CustomCakeFlavor');
const CustomCakeColor = require('./src/models/CustomCakeColor');
const CustomCakeThemeColor = require('./src/models/CustomCakeThemeColor');

const connectDB = require('./src/config/db');

const migrateThemes = async () => {
  await connectDB();

  console.log('Starting theme migration...');

  try {
    const activeFlavors = await CustomCakeFlavor.find({ isActive: true });
    const allColors = await CustomCakeColor.find();

    const themes = await CustomCakeTheme.find();

    for (let theme of themes) {
      console.log(`Migrating theme: ${theme.name}`);
      
      // 1. Embed Flavors
      const mappedFlavors = activeFlavors.map(f => ({
        name: f.name,
        category: f.category,
        weights: f.weights,
        isActive: f.isActive
      }));

      // 2. Embed Colors & Merge mappings from CustomCakeThemeColor
      const themeColorMappings = await CustomCakeThemeColor.find({ themeId: theme._id });
      
      const mappedColors = allColors.map(c => {
        const mapping = themeColorMappings.find(tm => tm.colorId.toString() === c._id.toString());
        
        let images = { tier1: null, tier2: null, tier3: null };
        let price = 0;

        if (mapping) {
          // Check if mapping uses the new images object or the old single image string
          if (mapping.images && (mapping.images.tier1 || mapping.images.tier2 || mapping.images.tier3)) {
            images = mapping.images;
          } else if (mapping.image) {
            images.tier1 = mapping.image;
          }
          price = mapping.price || 0;
        }

        return {
          name: c.name,
          hexCode: c.hexCode,
          isActive: c.isActive,
          price: price,
          images: images
        };
      });

      // 3. Update theme
      theme.flavors = mappedFlavors;
      theme.colors = mappedColors;
      
      await theme.save();
      console.log(`Theme ${theme.name} updated with ${mappedFlavors.length} flavors and ${mappedColors.length} colors.`);
    }

    console.log('Migration complete. You can now drop the CustomCakeThemeColor collection.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
};

migrateThemes();
